"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { CalendarDays, Plus, CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Routine {
  id: number;
  title: string;
  frequency: string;
  time_of_day: string | null;
}

interface HabitLog {
  id: number;
  routine_id: number;
  completed_at: string;
}

export default function RoutinesPage() {
  const { getToken } = useAuth();
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  
  const fetcher = async (url: string) => {
    const token = await getToken();
    return fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    }).then((res) => res.json());
  };

  const { data: routines, error, mutate } = useSWR<Routine[]>(`${API_BASE}/api/routines`, fetcher);
  
  // A bit simplistic for production, but we fetch logs for each routine for today
  // Alternatively we can just let the backend handle the 'completed today' logic

  const addRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineTitle.trim()) return;

    const token = await getToken();
    await fetch(`${API_BASE}/api/routines`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: newRoutineTitle, frequency: "daily" }),
    });

    setNewRoutineTitle("");
    mutate();
  };

  const logRoutine = async (routineId: number) => {
    const token = await getToken();
    await fetch(`${API_BASE}/api/routines/${routineId}/log`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    
    mutate(); 
  };

  return (
    <div className="p-8 max-w-4xl mx-auto mt-8">
      <header className="mb-10 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-foreground/5 text-foreground rounded-3xl flex items-center justify-center mb-4 border border-border shadow-sm transform rotate-6 hover:rotate-0 transition-smooth">
          <CalendarDays className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-semibold text-foreground tracking-tight">
          Routines & Habits
        </h1>
        <p className="text-text-muted mt-2 font-medium">Build consistency with daily tracking.</p>
      </header>

      {/* Add Routine Form */}
      <form onSubmit={addRoutine} className="mb-8 flex gap-3">
        <input
          type="text"
          value={newRoutineTitle}
          onChange={(e) => setNewRoutineTitle(e.target.value)}
          placeholder="New daily habit... (e.g. 'Read 20 pages')"
          className="flex-1 glass-panel px-5 py-3.5 text-foreground placeholder-text-muted focus:outline-none focus:border-foreground/30 focus:shadow-md transition-smooth font-medium text-lg rounded-2xl"
        />
        <button
          type="submit"
          disabled={!newRoutineTitle.trim()}
          className="bg-foreground text-background hover:opacity-90 px-6 py-3.5 rounded-2xl font-semibold transition-smooth hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
          Add Habit
        </button>
      </form>

      {/* Error & Loading States */}
      {error && <div className="text-red-500 mb-4 text-center">Failed to load routines.</div>}
      {!routines && !error && <div className="text-text-muted text-center py-8">Loading routines...</div>}

      {routines && routines.length === 0 && (
        <div className="text-center py-12 text-text-muted glass-panel rounded-2xl font-medium">
          No habits defined yet. Start small!
        </div>
      )}

      {routines && routines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map((routine) => (
            <div key={routine.id} className="glass-panel glass-panel-hover rounded-3xl p-5 flex items-center justify-between group transition-smooth">
              <div>
                <h3 className="text-foreground font-semibold text-lg">{routine.title}</h3>
                <div className="inline-block px-3 py-1 bg-foreground/5 text-foreground rounded-full text-[10px] font-bold uppercase tracking-wider mt-2 border border-border">
                  {routine.frequency}
                </div>
              </div>
              <button 
                onClick={() => logRoutine(routine.id)}
                className="text-border hover:text-foreground hover:bg-foreground/5 p-2 rounded-full transition-smooth hover:scale-110 active:scale-95"
                title="Mark completed for today"
              >
                <CheckCircle2 className="w-8 h-8" strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
