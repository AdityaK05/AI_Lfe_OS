"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`flex h-screen overflow-hidden p-3 gap-4 ${isCollapsed ? 'flex-col' : 'flex-row'}`}>
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <main className="flex-1 overflow-y-auto glass-panel relative rounded-2xl custom-scrollbar">
        {children}
      </main>
    </div>
  );
}
