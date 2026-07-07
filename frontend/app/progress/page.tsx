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
  const COLORS = ["var(--foreground)", "rgba(var(--foreground), 0.1)"]; // Pie chart colors using CSS variables

  
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
        <div className="w-16 h-16 bg-foreground/5 text-foreground rounded-3xl flex items-center justify-center mb-4 border border-border shadow-sm transform -rotate-3 hover:rotate-0 transition-smooth">
          <BarChart3 className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-semibold text-foreground tracking-tight">
          Progress & Insights
        </h1>
        <p className="text-text-muted mt-2 font-medium">Track your daily momentum and long-term velocity.</p>
      </header>

      {error && <div className="text-red-500 mb-4 text-center">Failed to load statistics.</div>}
      {!stats && !error && <div className="text-text-muted text-center py-8">Loading insights...</div>}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Task Velocity */}
            <div className="glass-panel glass-panel-hover rounded-3xl p-6 transition-smooth flex flex-col items-center justify-center relative">
              <div className="flex items-center gap-3 text-cyan-500 mb-6 w-full justify-start">
                <div className="p-2 bg-cyan-500/10 rounded-xl">
                  <Target className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-[15px] tracking-wide text-foreground">Task Velocity</h3>
              </div>
              <div className="text-5xl font-bold text-foreground mb-2 self-start w-full text-left">
                {stats.tasks_completed_today} <span className="text-xl text-text-muted font-medium">/ {stats.tasks_total_today}</span>
              </div>
              <p className="text-sm font-medium text-text-muted self-start">Tasks completed today</p>
            </div>

            {/* Consistency */}
            <div className="glass-panel glass-panel-hover rounded-3xl p-6 transition-smooth flex flex-col items-center justify-center relative">
              <div className="flex items-center gap-3 text-emerald-500 mb-6 w-full justify-start">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <TrendingUp className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-[15px] tracking-wide text-foreground">Consistency</h3>
              </div>
              <div className="text-5xl font-bold text-foreground mb-2 self-start w-full text-left">
                {stats.routines_completed_today} <span className="text-xl text-text-muted font-medium">/ {stats.routines_total_today}</span>
              </div>
              <p className="text-sm font-medium text-text-muted self-start">Routines maintained today</p>
            </div>

            {/* Overall */}
            <div className="glass-panel glass-panel-hover rounded-3xl p-6 flex flex-col items-center justify-center relative transition-smooth">
              <div className="absolute top-6 left-6 flex items-center gap-3 text-purple-500">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <Activity className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-[15px] tracking-wide text-foreground">Overall</h3>
              </div>
              <div className="w-24 h-24 mt-8 relative flex items-center justify-center">
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
                        <Cell key={`cell-${index}`} fill={index === 0 ? "var(--foreground)" : "rgba(150,150,150,0.2)"} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex items-center justify-center text-lg font-medium text-foreground">
                  {taskCompletionRate}%
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Volume */}
          <div className="glass-panel glass-panel-hover rounded-3xl p-8 h-80 transition-smooth">
            <h3 className="font-semibold text-[15px] tracking-wide text-foreground mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
              Weekly Volume (Simulated)
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={13} tickLine={false} axisLine={false} fontFamily="inherit" fontWeight={500} />
                <YAxis stroke="var(--text-muted)" fontSize={13} tickLine={false} axisLine={false} fontFamily="inherit" fontWeight={500} />
                <RechartsTooltip 
                  cursor={{ fill: "var(--foreground)", opacity: 0.05 }} 
                  contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", fontSize: "14px", color: "var(--foreground)", fontWeight: "500", padding: "12px", backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} 
                />
                <Bar dataKey="tasks" name="Tasks" fill="#22d3ee" radius={[8, 8, 0, 0]} maxBarSize={30} opacity={0.8} />
                <Bar dataKey="routines" name="Routines" fill="#34d399" radius={[8, 8, 0, 0]} maxBarSize={30} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
