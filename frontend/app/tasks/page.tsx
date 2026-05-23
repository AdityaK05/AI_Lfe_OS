"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Plus, CheckSquare, Sparkles, Trash2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
}

export default function TasksPage() {
  const { getToken } = useAuth();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  
  const fetcher = async (url: string) => {
    const token = await getToken();
    return fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    }).then((res) => res.json());
  };

  const { data: tasks, error, mutate } = useSWR<Task[]>(`${API_BASE}/api/tasks`, fetcher);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const token = await getToken();
    await fetch(`${API_BASE}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: newTaskTitle, status: "TODO" }),
    });

    setNewTaskTitle("");
    mutate();
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    const token = await getToken();
    await fetch(`${API_BASE}/api/tasks/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    mutate();
  };

  const deleteTask = async (taskId: number) => {
    const token = await getToken();
    await fetch(`${API_BASE}/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    mutate();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto mt-8">
      <header className="mb-10 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-4 shadow-sm transform -rotate-6 hover:rotate-0 transition-transform duration-300">
          <CheckSquare className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Task Management
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Organize your life, powered by AI.</p>
      </header>

      {/* Add Task Input */}
      <form onSubmit={addTask} className="mb-8 flex gap-3 relative">
        <div className="flex-1 relative group">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done? (e.g. 'Buy groceries')"
            className="w-full bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-sm rounded-2xl px-5 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/50 transition-all font-medium text-lg"
          />
        </div>
        <button
          type="submit"
          disabled={!newTaskTitle.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
        <button
          type="button"
          title="Ask Nova to break down a complex task"
          className="bg-white hover:bg-indigo-50 text-indigo-500 px-5 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center border-2 border-indigo-100 shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </form>

      {/* Task List */}
      {error && <div className="text-red-500 mb-4">Failed to load tasks.</div>}
      {!tasks && !error && <div className="text-gray-500">Loading tasks...</div>}
      
      {tasks && tasks.length === 0 && (
        <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-md bg-white shadow-sm">
          No tasks yet. You're all caught up!
        </div>
      )}

      {tasks && tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                task.status === "DONE"
                  ? "bg-white/40 border-transparent opacity-60"
                  : "bg-white/80 border-white/50 hover:border-indigo-100 shadow-sm"
              }`}
            >
              <button
                onClick={() => toggleTask(task)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all duration-300 ${
                  task.status === "DONE"
                    ? "bg-emerald-500 border-emerald-500 text-white scale-110 shadow-sm shadow-emerald-200"
                    : "border-gray-300 hover:border-indigo-400 bg-white"
                }`}
              >
                {task.status === "DONE" && <CheckSquare className="w-5 h-5" />}
              </button>
              <span className={`flex-1 text-lg font-medium transition-colors ${task.status === "DONE" ? "line-through text-gray-400" : "text-gray-800"}`}>
                {task.title}
              </span>
              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
