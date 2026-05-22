"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { fetchCalendarEvents, CalendarEvent } from "@/lib/api";

export default function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    async function loadEvents() {
      if (!isLoaded || !isSignedIn) return;
      try {
        setLoading(true);
        const token = await getToken();
        const data = await fetchCalendarEvents(7, token);
        if (data.length > 0 && (data[0] as any).error) {
          setError((data[0] as any).error);
          setEvents([]);
        } else {
          setEvents(data);
          setError(null);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="w-full glass-panel rounded-2xl p-4 transition-all group hover:border-white/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.05)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-200">Upcoming Schedule</h3>
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-10 bg-white/5 rounded-lg w-full"></div>
          <div className="h-10 bg-white/5 rounded-lg w-full"></div>
        </div>
      ) : error ? (
        <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
          ⚠️ {error}
        </div>
      ) : events.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">No upcoming events.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
          {events.map((event, idx) => {
            const startDate = new Date(event.start);
            const isToday = startDate.toDateString() === new Date().toDateString();
            
            return (
              <div key={event.id || idx} className="flex flex-col p-2.5 rounded-lg glass-panel-hover border border-transparent transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium text-gray-200 truncate pr-2">{event.summary}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap ${isToday ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-gray-400'}`}>
                    {isToday ? "Today" : startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">
                  {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
