"use client";

import React, { useState, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { uploadDocument } from "@/lib/api";
import { Paperclip, Loader2, CheckCircle2, Send, ArrowUp } from "lucide-react";

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
    <div className="relative flex items-end gap-3 px-5 py-3 glass-panel focus-within:border-foreground/30 focus-within:shadow-md transition-smooth rounded-[24px]">
      
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
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-smooth ${
          uploadSuccess 
            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
            : isUploading
            ? "bg-foreground/5 text-foreground/50"
            : "bg-transparent text-text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent hover:border-border"
        } disabled:opacity-50`}
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : uploadSuccess ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Paperclip className="w-5 h-5" strokeWidth={1.5} />
        )}
      </button>

      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? "Processing..." : "Ask Nova..."}
        rows={1}
        className="flex-1 bg-transparent text-foreground placeholder-text-muted resize-none outline-none text-[15px] leading-relaxed max-h-40 scrollbar-thin py-2.5"
        id="chat-input"
      />

      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center transition-smooth hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 shadow-sm"
        id="send-button"
        aria-label="Send message"
      >
        <ArrowUp className="w-5 h-5" strokeWidth={2} />
      </button>
    </div>
  );
}
