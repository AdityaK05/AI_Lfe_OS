"use client";

/**
 * AI Life OS — Chat Welcome Screen
 * Empty state shown when no messages exist.
 */

import React from "react";

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
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-cyan-500/20 animate-gradient">
        <span className="text-2xl font-bold text-white">J</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-200 mb-2">
        Hello. I&apos;m JARVIS.
      </h2>
      <p className="text-sm text-gray-500 max-w-md leading-relaxed">
        Your personal AI operating system. Ask me anything — I can help
        with code, research, planning, and more.
      </p>
      <div className="flex gap-2 mt-6">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestion(suggestion)}
            className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-all duration-200"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
