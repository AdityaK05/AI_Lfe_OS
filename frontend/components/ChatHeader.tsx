"use client";

/**
 * AI Life OS — Chat Header
 * Top bar with logo, RAG toggle, docs panel, model selector, and clear.
 */

import React from "react";
import ModelSelector from "@/components/ModelSelector";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

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

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 animate-gradient">
          <span className="text-sm font-bold text-white tracking-tight">J</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-100 tracking-tight">AI Life OS</h1>
          <p className="text-[10px] text-gray-500 font-mono">Core Intelligence · v0.2</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleRag}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all duration-200 ${
            useRag
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/5"
          }`}
          id="rag-toggle"
          title="Toggle RAG (retrieval-augmented generation)"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          RAG
        </button>

        <button
          onClick={onToggleAgent}
          className={`relative px-3 py-1.5 rounded-lg text-xs border transition-all duration-300 font-semibold tracking-wide flex items-center gap-2 overflow-hidden ${
            useAgent
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse-ring"
              : "border-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/5"
          }`}
          id="agent-toggle"
        >
          {useAgent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-pulse" />}
          OS Agent
        </button>

        <ModelSelector currentModel={currentModel} onSelect={onSelectModel} disabled={isStreaming} />
        <button
          onClick={onClear}
          disabled={isStreaming || !hasMessages}
          className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-white/5 transition-all duration-200 disabled:opacity-30"
          id="clear-chat-button"
        >
          Clear
        </button>

        <div className="ml-2 flex items-center">
          {isLoaded && !userId && (
            <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer">
              <SignInButton mode="modal" />
            </div>
          )}
          {isLoaded && userId && (
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-lg" } }} />
          )}
        </div>
      </div>
    </header>
  );
}
