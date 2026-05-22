# ✦ AI Life OS ✦

<p align="center">
  <em>An elegant, autonomous Operating System that seamlessly fuses Next.js, FastAPI, and LangGraph into a single, cohesive command center.</em>
</p>

---

## 📖 The Vision

**AI Life OS** is not just another chatbot. It is a full-fledged, autonomous agentic ecosystem designed to manage your digital life. Built with a stunning glassmorphic UI, it shifts the paradigm from "chatting with an LLM" to "commanding an OS." 

When activated, **JARVIS** (the Core Intelligence) gains the ability to read your emails, schedule your meetings, and traverse your knowledge base, executing complex multi-step reasoning to automate real-world tasks.

---

## 🧠 Core Intelligence: The Prompts

The soul of AI Life OS is defined by its system prompts. Designed to be authoritative, concise, and highly actionable.

### JARVIS System Prompt
> *"You are JARVIS — an advanced AI Operating System.*
> *You have access to a suite of powerful tools including Gmail, Google Calendar, and Notion.*
> *You can execute actions on the user's behalf. Always inform the user of the result of your actions."*

This prompt acts as the foundational directive for the LangGraph ReAct agent, granting it autonomy to interpret ambiguous user requests, select the appropriate tools, and execute them in a secure loop.

---

## 🏗 System Architecture

### High-Level Design (HLD)
At a macro level, AI Life OS operates on a decoupled client-server architecture with real-time streaming capabilities:
1. **The Client (Next.js 15):** A highly reactive, glassmorphism-heavy frontend that maintains the state of the conversation, handles Clerk authentication, and renders rich widget data (Calendar, Documents).
2. **The Gateway (FastAPI):** A high-performance async Python backend that acts as the secure bridge. It validates Clerk JWTs, routes API calls, and handles Server-Sent Events (SSE) for streaming LLM tokens.
3. **The Engine (LangGraph):** The autonomous brain. It maintains conversational memory, decides whether to perform simple RAG (Retrieval-Augmented Generation) or to spin up a ReAct loop to execute physical tools.

### Low-Level Design (LLD)
1. **Frontend State Management:** Uses Zustand (`chatStore.ts`) to manage the complex state of streaming tokens, model selection (Groq vs OpenAI), and agent activation toggles.
2. **Backend Routing:** 
   - `/api/chat/stream`: Handles the core SSE generation loop.
   - `/api/calendar/events` & `/api/documents`: REST endpoints for widget hydration.
3. **Tool Registry (`tool_registry.py`):** Dynamically loads authorized tools (Gmail API, Google Calendar API). Each tool is wrapped in a Langchain `@tool` decorator with strictly typed Pydantic schemas to prevent LLM hallucination during arguments parsing.
4. **Memory Management:** SQLite/PostgreSQL checkpointing to preserve conversation history across sessions, ensuring JARVIS remembers previous context.

---

## 🌍 Real-Life Applications

AI Life OS is designed to be your ultimate digital proxy. Here is how it operates in the real world:

- **Executive Assistant:** *"JARVIS, look at my emails from the last 24 hours. Summarize the important ones, and if there's a meeting request, block out time on my Google Calendar for it."*
- **Knowledge Retrieval (RAG):** Upload your dense PDF research papers or internal company documentation. Ask: *"Cross-reference my uploaded Q3 report with the current calendar quarter."*
- **Automated Outreach:** *"Draft an email to the marketing team about the new campaign and send it directly."*

---

## 🛠 Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS V4 (Glassmorphism UI), Zustand, Clerk Auth.
- **Backend:** Python, FastAPI, Uvicorn, Server-Sent Events (SSE).
- **AI / LLM:** LangGraph (ReAct Agents), LangChain, Groq (Llama 3), OpenAI.
- **Integrations:** Google Workspace (Gmail, Calendar), Notion API.

---

## 🚀 Getting Started

1. **Clone the repository:** `git clone https://github.com/AdityaK05/AI_Lfe_OS.git`
2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python -m fastapi dev app/main.py --host localhost
   ```
4. **Environment Variables:** 
   Rename `.env.example` to `.env` in both `frontend/` and `backend/` and fill in your Clerk, Google, and LLM API keys.

---
<p align="center">
  <i>"For you, sir, always."</i>
</p>
