"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MessageSquare, 
  LayoutDashboard, 
  CheckSquare, 
  CalendarDays, 
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  const navItems = [
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Routines", href: "/routines", icon: CalendarDays },
    { name: "Progress", href: "/progress", icon: BarChart3 },
  ];

  return (
    <aside className="w-64 h-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/50 flex flex-col flex-shrink-0 relative z-10 transition-all duration-300">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-center px-4 py-3 rounded-2xl hover:bg-white cursor-pointer transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-transparent hover:border-indigo-100 bg-white/50">
          <h1 className="text-base font-extrabold text-indigo-900 tracking-tight">Aditya's Space</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-[2px] overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm transition-all duration-300 font-medium group ${
                isActive 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50 scale-[1.02]" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm hover:scale-[1.02]"
              }`}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-indigo-500"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all hover:scale-[1.02]">
          <Settings className="w-5 h-5 text-gray-400" />
          Settings
        </button>
        <button 
          onClick={() => signOut({ redirectUrl: "/" })}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50 hover:shadow-sm transition-all hover:scale-[1.02]"
        >
          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-rose-500" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
