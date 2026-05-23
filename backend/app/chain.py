"""
AI Life OS — Conversation Chain
LangChain wrapper with per-user windowed memory and system prompt.
"""

import logging
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.config import get_settings
from app.llm_router import LLMRouter
from app.models import Message

logger = logging.getLogger(__name__)

# ── System prompt ─────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are Nova — an advanced personal AI operating system.

You are intelligent, proactive, and efficient. You speak with calm confidence
and subtle wit, like a brilliant assistant who genuinely cares about the user's
success. You adapt your communication style to the context: technical when
discussing code, warm when the user needs support, concise when they're busy.

Core behaviors:
- Give direct, actionable answers. Avoid unnecessary preamble.
- When you don't know something, say so honestly.
- Use markdown formatting for structured responses.
- Remember context from the conversation and build on it.
- Be opinionated when asked for recommendations — justify your choices.

You are Module 1 of the AI Life OS — the Core Intelligence Layer."""

# ── Per-user memory store ─────────────────────────────────────────────

_memory_store: dict[str, list[dict]] = {}


def _get_user_memory(user_id: str) -> list[dict]:
    """Get or create conversation memory for a user."""
    if user_id not in _memory_store:
        _memory_store[user_id] = []
    return _memory_store[user_id]


def _trim_memory(memory: list[dict], window: int) -> list[dict]:
    """Keep only the last `window` turns (each turn = user + assistant)."""
    # Each turn is 2 messages; keep last `window * 2` messages
    max_messages = window * 2
    if len(memory) > max_messages:
        return memory[-max_messages:]
    return memory


def _convert_to_langchain_messages(messages: list[dict]) -> list:
    """Convert raw dicts to LangChain message objects."""
    lc_messages = []
    for msg in messages:
        role = msg["role"]
        content = msg["content"]
        if role == "user":
            lc_messages.append(HumanMessage(content=content))
        elif role == "assistant":
            lc_messages.append(AIMessage(content=content))
        elif role == "system":
            lc_messages.append(SystemMessage(content=content))
    return lc_messages


# ── Main streaming function ──────────────────────────────────────────


async def stream_chat(
    messages: list[Message],
    model_name: str,
    user_id: str,
):
    """
    Stream a chat response with conversation memory.

    Yields string tokens as they arrive from the LLM.
    Automatically manages per-user memory windowing.
    """
    settings = get_settings()
    router = LLMRouter()

    # Build full message history: system + memory + new user messages
    memory = _get_user_memory(user_id)

    # Convert incoming request messages to dicts
    new_messages = [{"role": m.role, "content": m.content} for m in messages]

    # Merge memory + new messages, then trim to window
    full_history = memory + new_messages
    full_history = _trim_memory(full_history, settings.memory_window)

    # Build LangChain message list
    lc_messages = [SystemMessage(content=SYSTEM_PROMPT)]
    lc_messages += _convert_to_langchain_messages(full_history)

    logger.info(
        "Streaming for user=%s model=%s history=%d messages",
        user_id, model_name, len(full_history),
    )

    # Stream response and accumulate full text
    full_response = ""
    async for token in router.stream_with_fallback(model_name, lc_messages):
        full_response += token
        yield token

    # Save to memory: add new user messages + assistant response
    for msg in new_messages:
        if msg not in memory:
            memory.append(msg)
    memory.append({"role": "assistant", "content": full_response})

    # Trim memory after adding new messages
    _memory_store[user_id] = _trim_memory(memory, settings.memory_window)


def clear_memory(user_id: str) -> bool:
    """Clear conversation memory for a user."""
    if user_id in _memory_store:
        del _memory_store[user_id]
        return True
    return False
