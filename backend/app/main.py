"""
AI Life OS — FastAPI Application
Streaming chat endpoint with SSE, memory, and document management.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.config import get_settings
from app.models import ChatRequestWithRAG, TokenEvent
from app.chain import stream_chat
from app.llm_router import get_supported_models
from app.rag_chain import stream_rag_chat
from app.routes_memory import router as memory_router
from app.clerk_middleware import ClerkMiddleware
from app.tools.calendar_tool import list_events as calendar_list_events

# ── Logging ───────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(name)-20s │ %(levelname)-7s │ %(message)s",
)
logger = logging.getLogger(__name__)

# ── App setup ─────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Life OS — Core Intelligence",
    description="Streaming conversational AI with smart LLM routing and RAG",
    version="0.2.0",
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Clerk Auth middleware (exempting health, models, etc.)
app.add_middleware(
    ClerkMiddleware,
    public_routes=["/health", "/models", "/docs", "/openapi.json"]
)

# Include Module 2 routes
app.include_router(memory_router)


# ── SSE streaming helper ─────────────────────────────────────────────

async def _sse_generator(request: ChatRequestWithRAG):
    """Yield SSE-formatted token events from the chain."""
    try:
        if request.use_rag:
            token_stream = stream_rag_chat(
                messages=request.messages,
                model_name=request.model,
                user_id=request.user_id,
            )
        else:
            token_stream = stream_chat(
                messages=request.messages,
                model_name=request.model,
                user_id=request.user_id,
            )

        async for token in token_stream:
            event = TokenEvent(token=token, done=False)
            yield f"data: {event.model_dump_json()}\n\n"

        done_event = TokenEvent(token="", done=True)
        yield f"data: {done_event.model_dump_json()}\n\n"

    except (ValueError, ConnectionError) as e:
        error_event = TokenEvent(error=str(e), done=True)
        yield f"data: {error_event.model_dump_json()}\n\n"

    except Exception as e:
        logger.exception("Unexpected error during streaming")
        error_event = TokenEvent(
            error=f"Internal error: {type(e).__name__}", done=True
        )
        yield f"data: {error_event.model_dump_json()}\n\n"


# ── Chat endpoint ────────────────────────────────────────────────────

@app.post("/chat")
async def chat(request: ChatRequestWithRAG):
    """Stream a chat response via SSE. Set use_rag=true for RAG mode."""
    logger.info(
        "Chat request: model=%s user=%s rag=%s msgs=%d",
        request.model, request.user_id, request.use_rag, len(request.messages),
    )
    return StreamingResponse(
        _sse_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ── Multi-Agent Orchestration (Module 3) ─────────────────────────────

async def _agent_sse_generator(request: ChatRequestWithRAG):
    """Run LangGraph and stream tokens from the responder node."""
    try:
        from langchain_core.messages import HumanMessage, AIMessage
        from app.graph import graph
        
        lc_messages = []
        for m in request.messages:
            if m.role == "user":
                lc_messages.append(HumanMessage(content=m.content))
            elif m.role == "assistant":
                lc_messages.append(AIMessage(content=m.content))
                
        initial_state = {
            "messages": lc_messages,
            "tool_results": [],
            "metadata": {}
        }
        
        # Stream events from LangGraph, filtering for the agent LLM chunks
        async for event in graph.astream_events(initial_state, version="v1"):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                # Only yield tokens from the agent node
                node = event.get("metadata", {}).get("langgraph_node")
                if node == "agent":
                    chunk = event["data"]["chunk"].content
                    # Sometimes chunk is a list or empty if tool_calls are streaming
                    if isinstance(chunk, str) and chunk:
                        ev = TokenEvent(token=chunk, done=False)
                        yield f"data: {ev.model_dump_json()}\n\n"
                        
        done_event = TokenEvent(token="", done=True)
        yield f"data: {done_event.model_dump_json()}\n\n"
        
    except Exception as e:
        logger.exception("Agent streaming error")
        error_event = TokenEvent(error=str(e), done=True)
        yield f"data: {error_event.model_dump_json()}\n\n"


@app.post("/agent/run")
async def agent_run(request: ChatRequestWithRAG):
    """Run the multi-agent graph and stream the final response via SSE."""
    logger.info("Agent run request for user=%s", request.user_id)
    return StreamingResponse(
        _agent_sse_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ── Utility endpoints ────────────────────────────────────────────────

@app.get("/models")
async def list_models():
    """Return available models and their status."""
    return {"models": get_supported_models()}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "ai-life-os-core",
        "version": "0.2.0",
        "groq_configured": settings.has_groq_key,
        "modules": ["core-intelligence", "long-term-memory"],
    }

@app.get("/calendar/events")
async def get_calendar_events(days: int = 7):
    """Fetch upcoming calendar events for the dashboard."""
    try:
        events = calendar_list_events(days=days)
        return {"events": events}
    except Exception as e:
        logger.error(f"Failed to fetch calendar events: {e}")
        return {"error": str(e), "events": []}

