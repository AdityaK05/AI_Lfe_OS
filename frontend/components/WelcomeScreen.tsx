"use client";

/**
 * AI Life OS — Chat Welcome Screen
 * Empty state shown when no messages exist.
 */

import React from "react";
import { Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  onSuggestion: (text: string) => void;
}

const SUGGESTIONS = [
  "What can you do?",
  "Help me plan my day",
  "Write some code",
];

export default function WelcomeScreen({ onSuggestion }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in mt-12">
      <div className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-white shadow-xl shadow-indigo-100 flex items-center justify-center mb-8 relative overflow-hidden group hover:scale-110 transition-all duration-500 hover:shadow-indigo-200">
        <Sparkles className="w-10 h-10 text-indigo-500 animate-[pulse_3s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-indigo-400/10 rounded-full blur-xl group-hover:bg-indigo-400/30 transition-all duration-500"></div>
      </div>
      <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
        Hello. I'm Nova.
      </h2>
      <p className="text-[15px] text-gray-500 max-w-md leading-relaxed font-medium">
        Your personal AI operating system. Ask me anything — I can help
        with code, research, planning, and more.
      </p>
      <div className="flex gap-3 mt-8">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestion(suggestion)}
            className="px-5 py-3 text-[14px] font-bold rounded-2xl bg-white/80 border-2 border-white/50 text-indigo-600 hover:text-indigo-700 hover:bg-white shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 hover:-translate-y-1 active:scale-95"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
