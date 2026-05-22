# 🧠 AI Life OS — Module 1: Core Intelligence Layer

A Jarvis-like personal AI operating system. This module is the foundation — a streaming conversational AI backend with smart LLM routing between cloud (Groq) and local (Ollama) models.

## Architecture

```
┌─────────────────────┐     SSE Stream     ┌──────────────────────┐
│   Next.js Frontend  │ ◄════════════════► │   FastAPI Backend    │
│   (port 3000)       │    POST /chat      │   (port 8000)       │
└─────────────────────┘                    └──────────┬───────────┘
                                                      │
                                           ┌──────────┴───────────┐
                                           │     LLM Router       │
                                           │  retry + fallback    │
                                           └──────┬──────┬────────┘
                                                  │      │
                                           ┌──────┘      └──────┐
                                           ▼                     ▼
                                    ┌─────────────┐    ┌─────────────┐
                                    │  Groq Cloud  │    │ Ollama Local │
                                    │  (free tier) │    │  (offline)   │
                                    └─────────────┘    └─────────────┘
```

## Quick Start

### Prerequisites

- **Python 3.11+** — [python.org](https://python.org)
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Groq API Key** (free) — [console.groq.com](https://console.groq.com)
- **Ollama** (optional, for local models) — [ollama.com](https://ollama.com)

### 1. Clone & Configure

```bash
cp .env.example .env
# Edit .env — add your GROQ_API_KEY
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Groq API key

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Start the dev server
npm run dev
```

### 4. Open the App

Navigate to [http://localhost:3000](http://localhost:3000) — you'll be redirected to the chat interface.

## Supported Models

| Model | Provider | Type | Requires |
|-------|----------|------|----------|
| `groq/llama-3.3-70b-versatile` | Groq | ☁️ Cloud | API Key |
| `groq/deepseek-r1-distill-llama-70b` | Groq | ☁️ Cloud | API Key |
| `ollama/llama3` | Ollama | 💻 Local | Ollama running |
| `ollama/mistral` | Ollama | 💻 Local | Ollama running |

### Setting Up Ollama Models

```bash
# Install Ollama, then pull models:
ollama pull llama3
ollama pull mistral

# Start the server (if not auto-started):
ollama serve
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat` | Stream chat response (SSE) |
| `GET` | `/models` | List available models |
| `DELETE` | `/memory/{user_id}` | Clear conversation memory |
| `GET` | `/health` | Health check |

### Example: Streaming Chat

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello JARVIS!"}],
    "model": "ollama/llama3",
    "user_id": "test"
  }'
```

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, LangChain 0.3+, Groq SDK, Ollama
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand
- **Streaming**: Server-Sent Events (SSE)
- **Cost**: $0 — Groq free tier + Ollama local

## Project Structure

```
AI-Life-OS/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + SSE /chat endpoint
│   │   ├── llm_router.py    # Groq/Ollama routing + retry/fallback
│   │   ├── chain.py         # LangChain conversation chain + memory
│   │   ├── models.py        # Pydantic request/response schemas
│   │   └── config.py        # Settings from .env
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── layout.tsx        # Root layout (Inter font, dark theme)
│   │   ├── page.tsx          # Redirect → /chat
│   │   └── chat/page.tsx     # Main chat interface
│   ├── components/
│   │   ├── ChatMessage.tsx   # Message bubble component
│   │   ├── ChatInput.tsx     # Input with auto-resize
│   │   └── ModelSelector.tsx # Model dropdown
│   ├── store/chatStore.ts    # Zustand state management
│   └── lib/api.ts            # SSE streaming client
├── .env.example
└── README.md
```
