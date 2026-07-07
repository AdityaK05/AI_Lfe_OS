"use client";



import React, { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useChatStore } from "@/store/chatStore";
import { streamChat } from "@/lib/api";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ChatHeader from "@/components/ChatHeader";
import WelcomeScreen from "@/components/WelcomeScreen";

export default function ChatPage() {
  const {
    messages, currentModel, isStreaming,
    addMessage, appendToLastMessage, setModel, setStreaming, clearChat,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [useRag, setUseRag] = useState(false);
  const [useAgent, setUseAgent] = useState(false);
  const { getToken, userId } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (content: string) => {
      if (isStreaming) return;

      addMessage("user", content);
      addMessage("assistant", "", currentModel);
      setStreaming(true);

      try {
        const chatMessages = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content },
        ];

        const token = await getToken();
        for await (const event of streamChat(chatMessages, currentModel, userId || "default", useRag, useAgent, token)) {
          if (event.error) { appendToLastMessage(`\n\n⚠️ Error: ${event.error}`); break; }
          if (event.token) appendToLastMessage(event.token);
          if (event.done) break;
        }
      } catch {
        appendToLastMessage(`\n\n⚠️ Connection error. Is the backend running on port 8000?`);
      } finally {
        setStreaming(false);
      }
    },
    [isStreaming, currentModel, messages, addMessage, appendToLastMessage, setStreaming, useRag, useAgent, getToken, userId]
  );

  return (
    <div className="flex h-full bg-transparent overflow-hidden text-foreground">
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
        <ChatHeader
          currentModel={currentModel}
          onSelectModel={setModel}
          useRag={useRag}
          onToggleRag={() => setUseRag(!useRag)}
          useAgent={useAgent}
          onToggleAgent={() => setUseAgent(!useAgent)}
          showDocs={false}
          onToggleDocs={() => {}}
          onClear={clearChat}
          isStreaming={isStreaming}
          hasMessages={messages.length > 0}
        />

        <div className="flex-1 overflow-y-auto px-4 md:px-8 xl:px-32 py-8 custom-scrollbar">
          {messages.length === 0 ? (
            <WelcomeScreen onSuggestion={handleSend} />
          ) : (
            <div className="max-w-4xl mx-auto flex flex-col pb-8">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id || idx}
                  role={msg.role}
                  content={msg.content}
                  model={msg.model}
                  isStreaming={isStreaming && idx === messages.length - 1 && msg.role === "assistant"}
                />
              ))}
              {isStreaming && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-4 animate-fade-in mt-4 ml-4">
                  <div className="w-8 h-8 rounded-lg bg-white border border-black/10 shadow-sm flex items-center justify-center relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent"></div>
                    <span className="text-sm font-semibold text-gray-900 tracking-tight relative z-10">N</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-8" />
            </div>
          )}
        </div>

        <footer className="px-4 md:px-8 xl:px-32 pb-8 pt-4 mt-auto sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-4xl mx-auto">
            <ChatInput onSend={handleSend} disabled={isStreaming} />
            <p className="text-center text-[11px] font-medium text-text-muted mt-3 tracking-wide">
              Nova can make mistakes. Verify important information.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
