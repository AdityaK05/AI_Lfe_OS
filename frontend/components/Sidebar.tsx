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
  LogOut,
  Triangle,
  PanelLeftClose,
  PanelTopClose
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const MinimalLogo = ({ horizontal }: { horizontal?: boolean }) => (
  <div className={`rounded-full flex items-center justify-center bg-foreground text-background shadow-sm ${horizontal ? 'w-8 h-8' : 'w-10 h-10'}`}>
    <Triangle className={`${horizontal ? 'w-4 h-4' : 'w-5 h-5'} fill-current`} strokeWidth={1} />
  </div>
);

export default function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  const navItems = [
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Routines", href: "/routines", icon: CalendarDays },
    { name: "Progress", href: "/progress", icon: BarChart3 },
  ];

  if (isCollapsed) {
    return (
      <header className="w-full glass-panel flex items-center justify-between px-6 py-3 flex-shrink-0 relative z-10 rounded-2xl">
        <div className="flex items-center gap-4">
          <MinimalLogo horizontal />
          <h1 className="text-[12px] font-medium tracking-[0.2em] text-foreground uppercase hidden md:block">Nova</h1>
          <button onClick={onToggle} className="p-2 text-text-muted hover:text-foreground transition-smooth ml-2 rounded-xl hover:bg-foreground/5">
             <PanelLeftClose className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        
        <nav className="flex items-center gap-2 overflow-x-auto custom-scrollbar flex-1 justify-center px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-smooth font-medium ${
                  isActive 
                    ? "bg-foreground/5 text-foreground shadow-sm" 
                    : "text-text-muted hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                <Icon className={`w-[16px] h-[16px] ${isActive ? "text-foreground" : "text-text-muted group-hover:text-foreground"}`} strokeWidth={1.5} />
                <span className="hidden lg:block whitespace-nowrap">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="flex items-center gap-2">
          <button className="p-2 text-text-muted hover:text-foreground hover:bg-foreground/5 rounded-xl transition-smooth">
            <Settings className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button 
            onClick={() => signOut({ redirectUrl: "/" })}
            className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-smooth"
          >
            <LogOut className="w-5 h-5 group-hover:text-red-500" strokeWidth={1.5} />
          </button>
        </div>
      </header>
    );
  }

  return (
    <aside className="w-64 h-full glass-panel flex flex-col flex-shrink-0 relative z-10 rounded-2xl overflow-hidden transition-all duration-300">
      {/* Brand Header */}
      <div className="p-8 pb-4 relative">
         <button onClick={onToggle} className="absolute top-4 right-4 p-2 text-text-muted hover:text-foreground transition-smooth rounded-xl hover:bg-foreground/5">
            <PanelTopClose className="w-5 h-5" strokeWidth={1.5} />
         </button>
        <div className="flex flex-col items-center gap-4">
          <MinimalLogo />
          <h1 className="text-[14px] font-medium tracking-[0.2em] text-foreground uppercase">Nova</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-smooth font-medium group relative overflow-hidden ${
                isActive 
                  ? "bg-foreground/5 text-foreground shadow-sm" 
                  : "text-text-muted hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              <Icon className={`w-[18px] h-[18px] transition-colors relative z-10 ${isActive ? "text-foreground" : "text-text-muted group-hover:text-foreground"}`} strokeWidth={1.5} />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 space-y-1 mt-auto">
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:text-foreground hover:bg-foreground/5 transition-smooth">
          <Settings className="w-[18px] h-[18px]" strokeWidth={1.5} />
          Settings
        </button>
        <button 
          onClick={() => signOut({ redirectUrl: "/" })}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-smooth"
        >
          <LogOut className="w-[18px] h-[18px] group-hover:text-red-500" strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
