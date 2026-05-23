"use client";

/**
 * AI Life OS — Productivity Dashboard (Module 4)
 * Displays MCP integrations, agent logs, and SWR auto-refreshing data.
 */

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Mail, Calendar as CalIcon, CheckSquare, Brain, Activity, Sparkles } from "lucide-react";

import { useAuth } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Interfaces & Types ───────────────────────────────────────────────

interface WidgetProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
}

interface EmailData {
  sender: string;
  subject: string;
}

interface TaskData {
  title: string;
  completed: boolean;
}

interface EventData {
  start: string;
  summary: string;
}

interface MemoryData {
  text: string;
}

// ── Components ───────────────────────────────────────────────────────

function WidgetCard({ title, icon: Icon, children, isLoading, isError, className = "" }: WidgetProps) {
  return (
    <div className={`bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border-2 border-white/50 p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="flex items-center gap-3 text-indigo-500">
        <div className="p-2 bg-indigo-50 rounded-xl">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <h3 className="text-[15px] font-bold text-gray-800 tracking-wide">{title}</h3>
      </div>
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse flex gap-2 flex-col h-full justify-center opacity-50">
            <div className="h-3 bg-white/10 rounded w-full"></div>
            <div className="h-3 bg-white/10 rounded w-4/5"></div>
            <div className="h-3 bg-white/10 rounded w-5/6"></div>
          </div>
        ) : isError ? (
          <div className="text-sm text-red-400 flex items-center h-full">Integration unavailable</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ── Dashboard Page ───────────────────────────────────────────────────

export default function DashboardPage() {
  const { getToken } = useAuth();
  
  // SWR Hooks (Refresh every 30s)
  const swrConfig = { refreshInterval: 30000, shouldRetryOnError: false };

  const fetcher = async (url: string) => {
    const token = await getToken();
    return fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    });
  };

  // For demonstration, these assume dedicated endpoints exist in FastAPI.
  // If they don't, these will just degrade gracefully.
  const { data: tasks, error: errTasks } = useSWR(`${API_BASE}/api/tasks`, fetcher, swrConfig);
  const { data: emails, error: errEmails } = useSWR(`${API_BASE}/api/emails`, fetcher, swrConfig);
  const { data: events, error: errEvents } = useSWR(`${API_BASE}/calendar/events`, fetcher, swrConfig);
  const { data: memories, error: errMemories } = useSWR(`${API_BASE}/memory/recent`, fetcher, swrConfig);

  const [agentLogs, setAgentLogs] = useState<string[]>([]);

  // Mock Agent Activity Stream
  useEffect(() => {
    const interval = setInterval(() => {
      const msgs = [
        "ORCHESTRATOR routing to PRODUCTIVITY",
        "PLANNER analyzing goal structure",
        "RESEARCH fetched 5 DuckDuckGo links",
        "RESPONDER synthesized final output"
      ];
      const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
      setAgentLogs((prev) => [randomMsg, ...prev].slice(0, 5));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const chartData = [
    { name: "Mon", tasks: 4 }, { name: "Tue", tasks: 7 }, { name: "Wed", tasks: 3 },
    { name: "Thu", tasks: 8 }, { name: "Fri", tasks: 5 }, { name: "Sat", tasks: 2 },
    { name: "Sun", tasks: 1 },
  ];

  return (
    <div className="min-h-screen text-gray-900 p-8 md:p-12 flex flex-col gap-8 bg-[#f9fafb]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md px-5 py-3 rounded-3xl border-2 border-white/50 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-indigo-50 border-2 border-white shadow-md shadow-indigo-100 flex items-center justify-center relative overflow-hidden group hover:scale-105 transition-all">
            <Sparkles className="w-6 h-6 text-indigo-500 animate-[pulse_3s_ease-in-out_infinite]" />
            <div className="absolute inset-0 bg-indigo-400/10 rounded-full blur-md group-hover:bg-indigo-400/30 transition-all"></div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Nova Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        
        {/* Email Widget */}
        <WidgetCard title="Recent Emails" icon={Mail} isLoading={!emails && !errEmails} isError={errEmails} className="md:col-span-2 lg:col-span-3">
          <div className="flex overflow-x-auto gap-4 pb-2 custom-scrollbar">
            {emails?.length ? emails.map((e: any, i: number) => {
              const senderName = e.sender.replace(/<.*>/, '').replace(/"/g, '').trim();
              return (
                <a 
                  key={i} 
                  href={`https://mail.google.com/mail/u/0/#inbox/${e.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col min-w-[280px] max-w-[280px] p-5 rounded-2xl border-2 border-white/50 bg-white hover:border-indigo-100 hover:bg-indigo-50/50 shadow-sm transition-all duration-300 group flex-shrink-0 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-900 truncate flex-1 text-[14px]">{senderName || "Unknown"}</span>
                  </div>
                  <span className="text-[14px] text-gray-600 line-clamp-2 leading-relaxed font-medium">{e.subject}</span>
                </a>
              );
            }) : <div className="text-gray-500 text-sm py-4">No new emails in inbox.</div>}
          </div>
        </WidgetCard>

        {/* Tasks Widget */}
        <WidgetCard title="Today's Tasks" icon={CheckSquare} isLoading={!tasks && !errTasks} isError={errTasks}>
          <ul className="text-sm space-y-2">
            {tasks?.length ? tasks.map((t: TaskData, i: number) => (
              <li key={i} className="flex items-center gap-2">
                <input type="checkbox" className="rounded bg-transparent border-gray-300 accent-black" />
                <span className={t.completed ? "line-through text-gray-400" : "text-gray-900"}>{t.title}</span>
              </li>
            )) : <li className="text-gray-500">Inbox zero! No tasks.</li>}
          </ul>
        </WidgetCard>

        {/* Calendar Widget */}
        <WidgetCard title="Upcoming (7 Days)" icon={CalIcon} isLoading={!events && !errEvents} isError={errEvents}>
          <ul className="text-sm space-y-3">
            {events?.events?.length ? events.events.map((ev: EventData, i: number) => (
              <li key={i}>
                <div className="font-medium text-gray-900">{new Date(ev.start).toLocaleDateString()}</div>
                <div className="text-gray-500 truncate">{ev.summary}</div>
              </li>
            )) : <li className="text-gray-500">No upcoming events.</li>}
          </ul>
        </WidgetCard>

        {/* Memory Widget */}
        <WidgetCard title="Memory Fragments" icon={Brain} isLoading={!memories && !errMemories} isError={errMemories}>
          <ul className="text-sm space-y-3 text-gray-900">
            {memories?.results?.length ? memories.results.slice(0, 5).map((m: MemoryData, i: number) => (
              <li key={i} className="line-clamp-2 border-l-2 border-gray-200 pl-3 py-1">
                {m.text}
              </li>
            )) : <li className="text-gray-500">No memories found.</li>}
          </ul>
        </WidgetCard>

        {/* Agent Activity Log */}
        <WidgetCard title="Agent Handoff Log" icon={Activity}>
          <ul className="text-sm font-mono space-y-2 text-gray-500">
            {agentLogs.map((log, i) => (
              <li key={i}>&gt; {log}</li>
            ))}
          </ul>
        </WidgetCard>

        {/* Activity Chart */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border-2 border-white/50 p-6 md:col-span-2 lg:col-span-1 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 text-indigo-500 mb-6">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-800 tracking-wide">Weekly Velocity</h3>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} fontFamily="inherit" />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} fontFamily="inherit" />
                <Tooltip cursor={{ fill: "rgba(99,102,241,0.05)" }} contentStyle={{ backgroundColor: "#ffffff", border: "2px solid #e0e7ff", borderRadius: "16px", fontSize: "14px", color: "#111827", fontWeight: "bold", padding: "12px" }} />
                <Bar dataKey="tasks" fill="#818cf8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
      </div>
    </div>
  );
}
