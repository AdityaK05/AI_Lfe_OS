/**
 * AI Life OS — SSE Streaming Client
 * Consumes Server-Sent Events from the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface TokenEvent {
  token: string;
  done: boolean;
  error?: string;
}

/**
 * Stream chat tokens from the backend via SSE.
 * Yields individual string tokens as they arrive.
 */
export async function* streamChat(
  messages: ChatMessage[],
  model: string,
  userId: string,
  useRag: boolean = false,
  useAgent: boolean = false,
  token?: string | null
): AsyncGenerator<{ token?: string; error?: string; done: boolean }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const endpoint = useAgent ? "/agent/run" : "/chat";
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ messages, model, user_id: userId, use_rag: useRag }),
  });

  if (!response.ok) {
    yield { error: `HTTP ${response.status}: ${response.statusText}`, done: true };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { error: "No response stream available", done: true };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const jsonStr = trimmed.slice(6); // Remove "data: " prefix
        try {
          const event: TokenEvent = JSON.parse(jsonStr);

          if (event.error) {
            yield { error: event.error, done: true };
            return;
          }

          yield { token: event.token, done: event.done };

          if (event.done) return;
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Fetch available models from the backend.
 */
export async function fetchModels(token?: string | null): Promise<
  { id: string; provider: string; model_id: string; available: boolean }[]
> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/models`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.models || [];
  } catch {
    return [];
  }
}


// ── Module 2: Document + Memory APIs ────────────────────────────────

export interface DocumentInfo {
  doc_id: string;
  title: string;
  source: string;
  chunks: number;
}

/**
 * Fetch list of uploaded documents for a user.
 */
export async function fetchDocuments(userId = "default", token?: string | null): Promise<DocumentInfo[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/documents/list?user_id=${userId}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.documents || [];
  } catch {
    return [];
  }
}

/**
 * Upload a document for RAG ingestion.
 */
export async function uploadDocument(
  file: File,
  userId: string = "default",
  token?: string | null
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", userId);

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  
  if (!res.ok) {
    let errMsg = "Failed to upload document";
    try {
      const errJson = await res.json();
      errMsg = errJson.detail || errMsg;
    } catch {
      const errText = await res.text();
      if (errText) errMsg = errText;
    }
    throw new Error(errMsg);
  }
  return res.json();
}

/**
 * Store a memory (conversation turn or note).
 */
export async function storeMemory(
  userId: string,
  text: string,
  metadata: Record<string, string> = {},
  token?: string | null
): Promise<{ id: string } | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    const res = await fetch(`${API_BASE}/memory/store`, {
      method: "POST",
      headers,
      body: JSON.stringify({ user_id: userId, text, metadata }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Query semantic memory.
 */
export async function queryMemory(
  userId: string,
  query: string,
  k = 5,
  token?: string | null
): Promise<{ id: string; text: string; distance: number; metadata: Record<string, unknown> }[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/memory/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({ user_id: userId, query, k }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}


// -- Module 4: Agent Integrations ------------------------------------

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
}

export async function fetchCalendarEvents(days: number = 7, token?: string | null): Promise<CalendarEvent[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/calendar/events?days=${days}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  } catch {
    return [];
  }
}
