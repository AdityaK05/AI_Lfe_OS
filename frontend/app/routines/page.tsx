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
    // In a real app we'd refresh a separate SWR for logs or add a "logged" property in the backend response
    mutate(); 
  };

  return (
    <div className="p-8 max-w-4xl mx-auto mt-8">
      <header className="mb-10 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-3xl flex items-center justify-center mb-4 shadow-sm transform rotate-6 hover:rotate-0 transition-transform duration-300">
          <CalendarDays className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Routines & Habits
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Build consistency with daily tracking.</p>
      </header>

      {/* Add Routine Input */}
      <form onSubmit={addRoutine} className="mb-8 flex gap-3">
        <input
          type="text"
          value={newRoutineTitle}
          onChange={(e) => setNewRoutineTitle(e.target.value)}
          placeholder="New daily habit... (e.g. 'Read 20 pages')"
          className="flex-1 bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-sm rounded-2xl px-5 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100/50 transition-all font-medium text-lg"
        />
        <button
          type="submit"
          disabled={!newRoutineTitle.trim()}
          className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 shadow-lg shadow-rose-200"
        >
          <Plus className="w-5 h-5" />
          Add Habit
        </button>
      </form>

      {/* Routines List */}
      {error && <div className="text-red-500 mb-4">Failed to load routines.</div>}
      {!routines && !error && <div className="text-gray-500">Loading routines...</div>}

      {routines && routines.length === 0 && (
        <div className="text-center py-12 text-gray-500 border border-gray-200 shadow-sm rounded-md bg-white">
          No habits defined yet. Start small!
        </div>
      )}

      {routines && routines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map((routine) => (
            <div key={routine.id} className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-sm rounded-3xl p-5 flex items-center justify-between group hover:border-rose-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div>
                <h3 className="text-gray-900 font-bold text-lg">{routine.title}</h3>
                <div className="inline-block px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2 border border-rose-100">
                  {routine.frequency}
                </div>
              </div>
              <button 
                onClick={() => logRoutine(routine.id)}
                className="text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 p-2 rounded-full transition-all hover:scale-110 active:scale-95"
                title="Mark completed for today"
              >
                <CheckCircle2 className="w-8 h-8" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
