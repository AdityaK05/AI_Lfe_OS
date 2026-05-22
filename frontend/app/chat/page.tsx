"use client";

/**
 * AI Life OS — Chat Page
 * Main conversational interface with streaming responses and RAG.
 */

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useChatStore } from "@/store/chatStore";
import { streamChat } from "@/lib/api";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ChatHeader from "@/components/ChatHeader";
import Dashboard from "@/components/Dashboard";
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
    <div className="flex h-screen bg-transparent overflow-hidden">
      {/* OS Left Pane: Dashboard Widgets */}
      <Dashboard />

      {/* Main Right Pane: AI Console */}
      <div className="flex-1 flex flex-col h-[calc(100vh-2rem)] m-4 ml-0 rounded-2xl glass-panel overflow-hidden relative shadow-2xl">
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

        <main className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestion={handleSend} />
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg, idx) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                model={msg.model}
                isStreaming={isStreaming && idx === messages.length - 1 && msg.role === "assistant"}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

        <footer className="px-6 pb-6 pt-2">
          <div className="max-w-4xl mx-auto">
            <ChatInput onSend={handleSend} disabled={isStreaming} />
            <p className="text-center text-[10px] text-gray-600 mt-2">
              JARVIS can make mistakes. Verify important information.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
