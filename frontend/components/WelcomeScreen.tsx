"use client";

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
      <div className="w-24 h-24 rounded-full bg-foreground/5 border border-border shadow-md flex items-center justify-center mb-8 relative overflow-hidden group hover:scale-105 transition-smooth hover:shadow-lg">
        <Sparkles className="w-10 h-10 text-foreground" strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-semibold text-foreground mb-4 tracking-tight">
        Hello. I'm Nova.
      </h2>
      <p className="text-[15px] text-text-muted max-w-md leading-relaxed font-medium">
        Your personal AI operating system. Ask me anything — I can help
        with code, research, planning, and more.
      </p>
      <div className="flex gap-3 mt-8">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestion(suggestion)}
            className="px-5 py-3 text-[14px] font-medium rounded-full glass-panel hover:text-foreground hover:bg-foreground/5 transition-smooth hover:-translate-y-1 active:scale-95"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
