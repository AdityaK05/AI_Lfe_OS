"use client";

/**
 * AI Life OS — Model Selector Component
 * Dropdown to pick between Groq cloud and Ollama local models.
 */

import React, { useState, useRef, useEffect } from "react";

interface ModelSelectorProps {
  currentModel: string;
  onSelect: (model: string) => void;
  disabled?: boolean;
}

const MODELS = [
  {
    id: "groq/llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    provider: "groq",
    badge: "Cloud",
  },
  {
    id: "groq/deepseek-r1-distill-llama-70b",
    label: "DeepSeek R1 70B",
    provider: "groq",
    badge: "Cloud",
  },
  {
    id: "ollama/llama3",
    label: "Llama 3",
    provider: "ollama",
    badge: "Local",
  },
  {
    id: "ollama/mistral",
    label: "Mistral",
    provider: "ollama",
    badge: "Local",
  },
];

export default function ModelSelector({
  currentModel,
  onSelect,
  disabled,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = MODELS.find((m) => m.id === currentModel) || MODELS[0];

  return (
    <div ref={ref} className="relative" id="model-selector">
      {/* Trigger button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 text-sm disabled:opacity-50"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            current.provider === "groq"
              ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
              : "bg-amber-400 shadow-sm shadow-amber-400/50"
          }`}
        />
        <span className="text-gray-300 font-medium">{current.label}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              Select Model
            </span>
          </div>

          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors ${
                model.id === currentModel ? "bg-white/5" : ""
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  model.provider === "groq"
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 font-medium">
                  {model.label}
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {model.id}
                </div>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                  model.provider === "groq"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {model.badge}
              </span>
              {model.id === currentModel && (
                <svg
                  className="w-4 h-4 text-cyan-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
