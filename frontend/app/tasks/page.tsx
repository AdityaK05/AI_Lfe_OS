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
        <div className="w-16 h-16 bg-foreground/5 text-foreground rounded-3xl flex items-center justify-center mb-4 border border-border shadow-sm transform -rotate-6 hover:rotate-0 transition-smooth">
          <CheckSquare className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-semibold text-foreground tracking-tight">
          Task Management
        </h1>
        <p className="text-text-muted mt-2 font-medium">Organize your life, powered by AI.</p>
      </header>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="mb-8 flex gap-3 relative">
        <div className="flex-1 relative group">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done? (e.g. 'Buy groceries')"
            className="w-full glass-panel px-5 py-3.5 text-foreground placeholder-text-muted focus:outline-none focus:border-foreground/30 focus:shadow-md transition-smooth font-medium text-lg rounded-2xl"
          />
        </div>
        <button
          type="submit"
          disabled={!newTaskTitle.trim()}
          className="bg-foreground text-background hover:opacity-90 px-6 py-3.5 rounded-2xl font-semibold transition-smooth hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
          Add Task
        </button>
        <button
          type="button"
          title="Ask Nova to break down a complex task"
          className="glass-panel text-foreground px-5 py-3.5 rounded-2xl transition-smooth hover:-translate-y-1 active:scale-95 flex items-center justify-center"
        >
          <Sparkles className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </form>

      {/* Task List */}
      {error && <div className="text-red-500 mb-4 text-center">Failed to load tasks.</div>}
      {!tasks && !error && <div className="text-text-muted text-center py-8">Loading tasks...</div>}
      
      {tasks && tasks.length === 0 && (
        <div className="text-center py-12 text-text-muted glass-panel rounded-2xl font-medium">
          No tasks yet. You're all caught up!
        </div>
      )}

      {tasks && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center gap-4 p-4 rounded-2xl transition-smooth glass-panel hover:-translate-y-1 ${
                task.status === "DONE"
                  ? "opacity-50"
                  : "glass-panel-hover"
              }`}
            >
              <button
                onClick={() => toggleTask(task)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-smooth ${
                  task.status === "DONE"
                    ? "bg-foreground border-foreground text-background scale-110 shadow-sm"
                    : "border-border hover:border-foreground/50 bg-background"
                }`}
              >
                {task.status === "DONE" && <CheckSquare className="w-4 h-4" strokeWidth={2} />}
              </button>
              <span className={`flex-1 text-lg font-medium transition-colors ${task.status === "DONE" ? "line-through text-text-muted" : "text-foreground"}`}>
                {task.title}
              </span>
              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 p-2.5 rounded-xl transition-smooth"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
