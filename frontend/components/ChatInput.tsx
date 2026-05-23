"use client";

/**
 * AI Life OS — Chat Input Component
 * Text input with send button. Enter to send, Shift+Enter for newline.
 */

import React, { useState, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { uploadDocument } from "@/lib/api";
import { Paperclip, Loader2, CheckCircle2, Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getToken, userId } = useAuth();

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const token = await getToken();
      await uploadDocument(file, userId || "default", token);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative flex items-end gap-3 px-6 py-4 rounded-3xl border-2 border-white/50 bg-white/80 focus-within:bg-white focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100/50 shadow-sm transition-all duration-300 backdrop-blur-md">
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.txt,.md,.markdown"
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        title="Upload Document for RAG"
        className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          uploadSuccess 
            ? "bg-emerald-100 text-emerald-600 border-2 border-emerald-200" 
            : isUploading
            ? "bg-indigo-50 text-indigo-400"
            : "bg-white text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border-2 border-transparent hover:border-indigo-100 shadow-sm"
        } disabled:opacity-50`}
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : uploadSuccess ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </button>

      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? "Nova is thinking..." : "Message Nova..."}
        rows={1}
        className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 resize-none outline-none text-[15px] leading-relaxed max-h-40 scrollbar-thin scrollbar-thumb-gray-200 py-2"
        id="chat-input"
      />

      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="flex-shrink-0 w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-indigo-700 disabled:opacity-30 disabled:hover:scale-100 shadow-md shadow-indigo-200"
        id="send-button"
        aria-label="Send message"
      >
        <Send className="w-4 h-4 ml-0.5" />
      </button>
    </div>
  );
}
