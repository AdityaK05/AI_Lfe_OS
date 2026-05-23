"use client";

import React from "react";
import useSWR from "swr";
import { BarChart3, TrendingUp, Target, Activity } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ProgressStats {
  tasks_completed_today: number;
  tasks_total_today: number;
  routines_completed_today: number;
  routines_total_today: number;
}

export default function ProgressPage() {
  const { getToken } = useAuth();
  
  const fetcher = async (url: string) => {
    const token = await getToken();
    return fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    }).then((res) => res.json());
  };

  const { data: stats, error } = useSWR<ProgressStats>(`${API_BASE}/api/progress`, fetcher);

  const taskCompletionRate = stats?.tasks_total_today 
    ? Math.round((stats.tasks_completed_today / stats.tasks_total_today) * 100) 
    : 0;

  const routineCompletionRate = stats?.routines_total_today 
    ? Math.round((stats.routines_completed_today / stats.routines_total_today) * 100) 
    : 0;

  const pieData = [
    { name: "Completed", value: taskCompletionRate },
    { name: "Remaining", value: 100 - taskCompletionRate }
  ];
  const COLORS = ["#111827", "#e5e7eb"];

  // Mock weekly data for bar chart since we only implemented 'today' in backend
  const weeklyData = [
    { name: "Mon", tasks: 4, routines: 2 },
    { name: "Tue", tasks: 7, routines: 3 },
    { name: "Wed", tasks: 3, routines: 1 },
    { name: "Thu", tasks: 8, routines: 4 },
    { name: "Fri", tasks: 5, routines: 2 },
    { name: "Sat", tasks: 2, routines: 0 },
    { name: "Sun", tasks: taskCompletionRate > 0 ? stats?.tasks_completed_today : 0, routines: routineCompletionRate > 0 ? stats?.routines_completed_today : 0 },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto mt-8">
      <header className="mb-10 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-3xl flex items-center justify-center mb-4 shadow-sm transform -rotate-3 hover:rotate-0 transition-transform duration-300">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Progress & Insights
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Track your daily momentum and long-term velocity.</p>
      </header>

      {error && <div className="text-red-500 mb-4">Failed to load statistics.</div>}
      {!stats && !error && <div className="text-gray-500">Loading insights...</div>}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Stat Card 1 */}
            <div className="bg-white/80 backdrop-blur-md border-2 border-white/50 rounded-3xl shadow-sm p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 text-cyan-600 mb-6">
                <div className="p-2 bg-cyan-50 rounded-xl">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[15px] tracking-wide">Task Velocity</h3>
              </div>
              <div className="text-5xl font-extrabold text-gray-900 mb-2">
                {stats.tasks_completed_today} <span className="text-xl text-gray-400 font-semibold">/ {stats.tasks_total_today}</span>
              </div>
              <p className="text-sm font-medium text-gray-500">Tasks completed today</p>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white/80 backdrop-blur-md border-2 border-white/50 rounded-3xl shadow-sm p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 text-emerald-600 mb-6">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[15px] tracking-wide">Consistency</h3>
              </div>
              <div className="text-5xl font-extrabold text-gray-900 mb-2">
                {stats.routines_completed_today} <span className="text-xl text-gray-400 font-semibold">/ {stats.routines_total_today}</span>
              </div>
              <p className="text-sm font-medium text-gray-500">Routines maintained today</p>
            </div>

            {/* Stat Card 3 (Pie) */}
            <div className="bg-white/80 backdrop-blur-md border-2 border-white/50 rounded-3xl shadow-sm p-6 flex flex-col items-center justify-center relative hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="absolute top-6 left-6 flex items-center gap-3 text-purple-600">
                <div className="p-2 bg-purple-50 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[15px] tracking-wide">Overall</h3>
              </div>
              <div className="w-24 h-24 mt-4 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex items-center justify-center text-lg font-medium text-gray-900">
                  {taskCompletionRate}%
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white/80 backdrop-blur-md border-2 border-white/50 rounded-3xl shadow-sm p-8 h-80 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <h3 className="font-bold text-[15px] tracking-wide text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
              Weekly Volume (Simulated)
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={13} tickLine={false} axisLine={false} fontFamily="inherit" fontWeight={500} />
                <YAxis stroke="#9ca3af" fontSize={13} tickLine={false} axisLine={false} fontFamily="inherit" fontWeight={500} />
                <RechartsTooltip 
                  cursor={{ fill: "rgba(6,182,212,0.05)" }} 
                  contentStyle={{ backgroundColor: "#ffffff", border: "2px solid #cffafe", borderRadius: "16px", fontSize: "14px", color: "#111827", fontWeight: "bold", padding: "12px" }} 
                />
                <Bar dataKey="tasks" name="Tasks" fill="#22d3ee" radius={[8, 8, 0, 0]} maxBarSize={30} />
                <Bar dataKey="routines" name="Routines" fill="#34d399" radius={[8, 8, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
