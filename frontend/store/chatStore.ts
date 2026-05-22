/**
 * AI Life OS — Chat Store (Zustand)
 * Manages conversation state, model selection, and streaming status.
 */

import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  model?: string;
}

interface ChatState {
  messages: Message[];
  currentModel: string;
  isStreaming: boolean;
  userId: string;

  // Actions
  addMessage: (role: Message["role"], content: string, model?: string) => string;
  appendToLastMessage: (token: string) => void;
  setModel: (model: string) => void;
  setStreaming: (streaming: boolean) => void;
  clearChat: () => void;
}

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentModel: "groq/llama-3.3-70b-versatile",
  isStreaming: false,
  userId: "default",

  addMessage: (role, content, model) => {
    const id = generateId();
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id,
          role,
          content,
          timestamp: Date.now(),
          model,
        },
      ],
    }));
    return id;
  },

  appendToLastMessage: (token) => {
    set((state) => {
      const msgs = [...state.messages];
      if (msgs.length > 0) {
        const last = { ...msgs[msgs.length - 1] };
        last.content += token;
        msgs[msgs.length - 1] = last;
      }
      return { messages: msgs };
    });
  },

  setModel: (model) => set({ currentModel: model }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),

  clearChat: () => set({ messages: [] }),
}));
