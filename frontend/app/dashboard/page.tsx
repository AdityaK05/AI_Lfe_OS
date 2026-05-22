"use client";

/**
 * AI Life OS — Productivity Dashboard (Module 4)
 * Displays MCP integrations, agent logs, and SWR auto-refreshing data.
 */

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Mail, Calendar as CalIcon, CheckSquare, Brain, Activity } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ── Interfaces & Types ───────────────────────────────────────────────

interface WidgetProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
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

function WidgetCard({ title, icon: Icon, children, isLoading, isError }: WidgetProps) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-gray-300">
        <Icon className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold tracking-wide uppercase">{title}</h3>
      </div>
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse flex gap-2 flex-col h-full justify-center opacity-50">
            <div className="h-3 bg-white/10 rounded w-full"></div>
            <div className="h-3 bg-white/10 rounded w-4/5"></div>
            <div className="h-3 bg-white/10 rounded w-5/6"></div>
          </div>
        ) : isError ? (
          <div className="text-xs text-red-400 flex items-center h-full">⚠️ Integration unavailable</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ── Dashboard Page ───────────────────────────────────────────────────

export default function DashboardPage() {
  // SWR Hooks (Refresh every 30s)
  const swrConfig = { refreshInterval: 30000, shouldRetryOnError: false };

  // For demonstration, these assume dedicated endpoints exist in FastAPI.
  // If they don't, these will just degrade gracefully.
  const { data: tasks, error: errTasks } = useSWR(`${API_BASE}/api/tasks`, fetcher, swrConfig);
  const { data: emails, error: errEmails } = useSWR(`${API_BASE}/api/emails`, fetcher, swrConfig);
  const { data: events, error: errEvents } = useSWR(`${API_BASE}/api/events`, fetcher, swrConfig);
  const { data: memories, error: errMemories } = useSWR(`${API_BASE}/memory/query`, fetcher, swrConfig);

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
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 p-8 flex flex-col gap-6">
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-lg font-bold text-white">J</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold">Productivity Dashboard</h1>
            <p className="text-xs text-gray-500">AI Life OS · MCP Integrations active</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        
        {/* Email Widget */}
        <WidgetCard title="Recent Emails" icon={Mail} isLoading={!emails && !errEmails} isError={errEmails}>
          <ul className="text-xs space-y-3">
            {emails?.length ? emails.map((e: EmailData, i: number) => (
              <li key={i} className="line-clamp-2">
                <span className="font-semibold text-gray-100">{e.sender}:</span> {e.subject}
              </li>
            )) : <li className="text-gray-500">No new emails in inbox.</li>}
          </ul>
        </WidgetCard>

        {/* Tasks Widget */}
        <WidgetCard title="Today's Tasks" icon={CheckSquare} isLoading={!tasks && !errTasks} isError={errTasks}>
          <ul className="text-xs space-y-2">
            {tasks?.length ? tasks.map((t: TaskData, i: number) => (
              <li key={i} className="flex items-center gap-2">
                <input type="checkbox" className="rounded bg-white/5 border-white/20 accent-cyan-500" />
                <span className={t.completed ? "line-through text-gray-500" : ""}>{t.title}</span>
              </li>
            )) : <li className="text-gray-500">Inbox zero! No tasks.</li>}
          </ul>
        </WidgetCard>

        {/* Calendar Widget */}
        <WidgetCard title="Upcoming (7 Days)" icon={CalIcon} isLoading={!events && !errEvents} isError={errEvents}>
          <ul className="text-xs space-y-3">
            {events?.length ? events.map((ev: EventData, i: number) => (
              <li key={i}>
                <div className="font-medium text-cyan-300">{new Date(ev.start).toLocaleDateString()}</div>
                <div className="text-gray-300 truncate">{ev.summary}</div>
              </li>
            )) : <li className="text-gray-500">No upcoming events.</li>}
          </ul>
        </WidgetCard>

        {/* Memory Widget */}
        <WidgetCard title="Memory Fragments" icon={Brain} isLoading={!memories && !errMemories} isError={errMemories}>
          <ul className="text-xs space-y-3 text-gray-400">
            {memories?.results?.length ? memories.results.slice(0, 5).map((m: MemoryData, i: number) => (
              <li key={i} className="line-clamp-2 border-l-2 border-purple-500/30 pl-2">
                {m.text}
              </li>
            )) : <li>No memories found.</li>}
          </ul>
        </WidgetCard>

        {/* Agent Activity Log */}
        <WidgetCard title="Agent Handoff Log" icon={Activity}>
          <ul className="text-xs font-mono space-y-2 text-emerald-400/80">
            {agentLogs.map((log, i) => (
              <li key={i}>&gt; {log}</li>
            ))}
          </ul>
        </WidgetCard>

        {/* Activity Chart */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 md:col-span-2 lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Weekly Task Velocity</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="tasks" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
      </div>
    </div>
  );
}
