"use client";

/**
 * AI Life OS — Chat Header
 * Top bar with logo, RAG toggle, docs panel, model selector, and clear.
 */

import React from "react";
import ModelSelector from "@/components/ModelSelector";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

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
    <header className="flex items-center justify-between px-8 py-4 border-b-2 border-white/50 bg-white/60 backdrop-blur-xl sticky top-0 z-10 rounded-t-3xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-indigo-50 border-2 border-white shadow-md shadow-indigo-100 flex items-center justify-center relative overflow-hidden group hover:scale-105 transition-all">
          <Sparkles className="w-6 h-6 text-indigo-500 animate-[pulse_3s_ease-in-out_infinite]" />
          <div className="absolute inset-0 bg-indigo-400/10 rounded-full blur-md group-hover:bg-indigo-400/30 transition-all"></div>
        </div>
        <div>
          <h1 className="text-[13px] font-semibold text-gray-900 tracking-tight leading-tight">Agent Workspace</h1>
          <p className="text-[10px] text-gray-500 font-medium">Core Intelligence · v0.3</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleRag}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all duration-200 font-medium ${
            useRag
              ? "border-black/10 bg-white text-gray-900 shadow-sm"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          }`}
          id="rag-toggle"
          title="Toggle RAG (retrieval-augmented generation)"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          Context
        </button>

        <button
          onClick={onToggleAgent}
          className={`relative px-3 py-1.5 rounded-full text-xs border transition-all duration-300 font-medium tracking-wide flex items-center gap-2 overflow-hidden ${
            useAgent
              ? "border-emerald-500/30 bg-emerald-50 text-emerald-600"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100"
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
          className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-transparent transition-all duration-200 disabled:opacity-30"
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
