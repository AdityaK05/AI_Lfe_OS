"use client";

import React from "react";
import CalendarWidget from "./CalendarWidget";
import DocumentListWidget from "./DocumentListWidget";

export default function Dashboard() {
  return (
    <div className="w-[320px] lg:w-[380px] flex-shrink-0 h-[calc(100vh-2rem)] m-4 rounded-2xl glass-panel flex flex-col overflow-y-auto custom-scrollbar shadow-2xl">
      <div className="p-6 pb-2">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Command Center</h2>
        <p className="text-[10px] text-gray-600">Active Integrations</p>
      </div>

      <div className="flex flex-col gap-6 p-6 pt-4">
        {}
        <section>
          <CalendarWidget />
        </section>

        {}
        <section>
          <DocumentListWidget />
        </section>
      </div>
    </div>
  );
}
