"use client";

import React from "react";
import ModelSelector from "@/components/ModelSelector";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { Sparkles, Sun, Moon, Database, Zap, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";

interface ChatHeaderProps {
  currentModel: string;
  onSelectModel: (model: string) => void;
  useRag: boolean;
  onToggleRag: () => void;
  useAgent: boolean;
  onToggleAgent: () => void;
  showDocs: boolean;
  onToggleDocs: () => void;
  onClear: () => void;
  isStreaming: boolean;
  hasMessages: boolean;
}

export default function ChatHeader({
  currentModel,
  onSelectModel,
  useRag,
  onToggleRag,
  useAgent,
  onToggleAgent,
  showDocs,
  onToggleDocs,
  onClear,
  isStreaming,
  hasMessages,
}: ChatHeaderProps) {
  const { isLoaded, userId } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-10 rounded-t-2xl">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-foreground/5 border border-border flex items-center justify-center relative overflow-hidden group">
          <Sparkles className="w-5 h-5 text-foreground" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-[14px] font-semibold text-foreground tracking-wide">Workspace</h1>
          <p className="text-[11px] text-text-muted font-medium mt-0.5">Core Intelligence</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleRag}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] transition-smooth font-medium border ${
            useRag
              ? "bg-foreground text-background border-foreground shadow-sm"
              : "border-transparent text-text-muted hover:text-foreground hover:bg-foreground/5"
          }`}
        >
          <Database className="w-3.5 h-3.5" strokeWidth={useRag ? 2 : 1.5} />
          Context
        </button>

        <button
          onClick={onToggleAgent}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] transition-smooth font-medium border ${
            useAgent
              ? "bg-foreground text-background border-foreground shadow-sm"
              : "border-transparent text-text-muted hover:text-foreground hover:bg-foreground/5"
          }`}
        >
          <Zap className="w-3.5 h-3.5" strokeWidth={useAgent ? 2 : 1.5} />
          Agent
        </button>

        <div className="border-l border-border h-6 mx-2"></div>

        <div className="opacity-90 hover:opacity-100 transition-opacity">
          <ModelSelector currentModel={currentModel} onSelect={onSelectModel} disabled={isStreaming} />
        </div>

        <button
          onClick={onClear}
          disabled={isStreaming || !hasMessages}
          className="p-2 rounded-full text-text-muted hover:text-foreground hover:bg-foreground/5 transition-smooth disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted"
          title="Clear Chat"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <div className="border-l border-border h-6 mx-2"></div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full text-text-muted hover:text-foreground hover:bg-foreground/5 transition-smooth"
          title="Toggle Theme"
        >
          <Sun className="w-4 h-4 hidden dark:block" strokeWidth={1.5} />
          <Moon className="w-4 h-4 block dark:hidden" strokeWidth={1.5} />
        </button>

        <div className="ml-2 flex items-center">
          {isLoaded && !userId && (
            <div className="px-4 py-1.5 rounded-full text-[13px] font-medium bg-foreground text-background hover:opacity-90 transition-smooth cursor-pointer">
              <SignInButton mode="modal" />
            </div>
          )}
          {isLoaded && userId && (
            <div className="rounded-full p-0.5 border border-border">
              <UserButton appearance={{ elements: { avatarBox: "w-7 h-7 rounded-full" } }} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
