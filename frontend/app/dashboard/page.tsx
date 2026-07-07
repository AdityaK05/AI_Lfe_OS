"use client";



import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Mail, Calendar as CalIcon, CheckSquare, Brain, Activity, Sparkles, FileText } from "lucide-react";

import { useAuth } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";



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



function WidgetCard({ title, icon: Icon, children, isLoading, isError, className = "" }: WidgetProps) {
  return (
    <div className={`glass-panel p-8 flex flex-col gap-6 group ${className}`}>
      <div className="flex items-center gap-3 text-foreground">
        <div className="p-2.5 bg-foreground/5 rounded-xl border border-border group-hover:bg-foreground/10 transition-colors">
          <Icon className="w-5 h-5 text-foreground opacity-80" strokeWidth={1.5} />
        </div>
        <h3 className="text-[13px] font-semibold text-foreground tracking-[0.1em] uppercase">{title}</h3>
      </div>
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse flex gap-3 flex-col h-full justify-center opacity-40">
            <div className="h-2 bg-foreground/20 rounded w-full"></div>
            <div className="h-2 bg-foreground/20 rounded w-4/5"></div>
            <div className="h-2 bg-foreground/20 rounded w-5/6"></div>
          </div>
        ) : isError ? (
          <div className="text-sm text-red-500/80 flex items-center h-full">System Unavailable</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}



export default function DashboardPage() {
  const { getToken, userId } = useAuth();
  
  
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

  
  
  const { data: tasks, error: errTasks } = useSWR(`${API_BASE}/api/tasks`, fetcher, swrConfig);
  const { data: emails, error: errEmails } = useSWR(`${API_BASE}/api/emails`, fetcher, swrConfig);
  const { data: events, error: errEvents } = useSWR(`${API_BASE}/calendar/events`, fetcher, swrConfig);
  const { data: memories, error: errMemories } = useSWR(userId ? `${API_BASE}/memory/recent?user_id=${userId}` : null, fetcher, swrConfig);
  const { data: documents, error: errDocuments } = useSWR(userId ? `${API_BASE}/documents/list?user_id=${userId}` : null, fetcher, swrConfig);

  const [agentLogs, setAgentLogs] = useState<string[]>([]);

  
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
    <div className="min-h-screen text-foreground p-8 md:p-12 flex flex-col gap-10 bg-transparent">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-foreground/5 border border-border flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-foreground opacity-80" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-light text-foreground tracking-tight">Overview</h1>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        
        {/* Recent Emails */}
        <WidgetCard title="Recent Emails" icon={Mail} isLoading={!emails && !errEmails} isError={errEmails} className="md:col-span-2 lg:col-span-3 xl:col-span-4">
          <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar">
            {emails?.length ? emails.map((e: any, i: number) => {
              const senderName = e.sender.replace(/<.*>/, '').replace(/"/g, '').trim();
              return (
                <a 
                  key={i} 
                  href={`https://mail.google.com/mail/u/0/#inbox/${e.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col min-w-[280px] max-w-[280px] p-6 rounded-2xl glass-panel glass-panel-hover flex-shrink-0"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-foreground/5 border border-border flex items-center justify-center text-foreground shrink-0">
                      <Mail className="w-4 h-4 opacity-70" strokeWidth={1.5} />
                    </div>
                    <span className="font-semibold text-foreground truncate flex-1 text-[14px]">{senderName || "Unknown"}</span>
                  </div>
                  <span className="text-[14px] text-text-muted line-clamp-2 leading-relaxed">{e.subject}</span>
                </a>
              );
            }) : <div className="text-text-muted text-sm py-4">No new emails in inbox.</div>}
          </div>
        </WidgetCard>

        <WidgetCard title="Today's Tasks" icon={CheckSquare} isLoading={!tasks && !errTasks} isError={errTasks}>
          <ul className="text-sm space-y-3">
            {tasks?.length ? tasks.map((t: TaskData, i: number) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors">
                <div className={`mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 ${t.completed ? 'bg-foreground border-foreground' : 'border-border'}`}></div>
                <span className={t.completed ? "line-through text-text-muted" : "text-foreground"}>{t.title}</span>
              </li>
            )) : <li className="text-text-muted">No pending tasks.</li>}
          </ul>
        </WidgetCard>

        {/* Upcoming Events */}
        <WidgetCard title="Upcoming" icon={CalIcon} isLoading={!events && !errEvents} isError={errEvents}>
          <ul className="text-sm space-y-4">
            {events?.events?.length ? events.events.map((ev: EventData, i: number) => (
              <li key={i} className="flex flex-col gap-1 p-3 rounded-xl hover:bg-foreground/5 transition-colors border-l-2 border-transparent hover:border-foreground">
                <div className="font-semibold text-foreground text-[12px] uppercase tracking-wider">{new Date(ev.start).toLocaleDateString()}</div>
                <div className="text-text-muted truncate">{ev.summary}</div>
              </li>
            )) : <li className="text-text-muted">No upcoming events.</li>}
          </ul>
        </WidgetCard>

        {/* Memory Fragments */}
        <WidgetCard title="Memory Fragments" icon={Brain} isLoading={!memories && !errMemories} isError={errMemories}>
          <ul className="text-[13px] space-y-4 text-text-muted">
            {memories?.results?.length ? memories.results.slice(0, 5).map((m: MemoryData, i: number) => (
              <li key={i} className="line-clamp-2 leading-relaxed italic p-3 bg-foreground/5 rounded-xl border border-border">
                "{m.text}"
              </li>
            )) : <li className="text-text-muted">No fragments found.</li>}
          </ul>
        </WidgetCard>

        {/* Uploaded Documents */}
        <WidgetCard title="Uploaded Documents" icon={FileText} isLoading={!documents && !errDocuments} isError={errDocuments}>
          <ul className="text-[13px] space-y-4 text-text-muted">
            {documents?.documents?.length ? documents.documents.map((d: any, i: number) => (
              <li key={i} className="flex flex-col p-3 bg-foreground/5 rounded-xl border border-border">
                <span className="font-semibold text-foreground truncate">{d.title}</span>
                <span className="text-[11px] opacity-70 mt-1">{d.chunks} chunks vectorized</span>
              </li>
            )) : <li className="text-text-muted">No documents uploaded.</li>}
          </ul>
        </WidgetCard>

        {}
        <WidgetCard title="Agent Log" icon={Activity}>
          <ul className="text-[12px] font-mono space-y-2 text-text-muted">
            {agentLogs.map((log, i) => (
              <li key={i} className="opacity-70">&middot; {log}</li>
            ))}
          </ul>
        </WidgetCard>

        {/* Chart */}
        <div className="glass-panel p-8 md:col-span-2 lg:col-span-1 xl:col-span-2">
          <div className="flex items-center gap-3 text-foreground mb-8">
            <div className="p-2.5 bg-foreground/5 rounded-xl border border-border">
              <Activity className="w-5 h-5 text-foreground opacity-80" strokeWidth={1.5} />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground tracking-[0.1em] uppercase">Weekly Velocity</h3>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "var(--foreground)", opacity: 0.05 }} contentStyle={{ backgroundColor: "var(--surface)", backdropFilter: "blur(12px)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "13px", color: "var(--foreground)", padding: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="tasks" fill="var(--foreground)" radius={[6, 6, 0, 0]} opacity={0.3} activeBar={{ opacity: 0.8 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
      </div>
    </div>
  );
}
