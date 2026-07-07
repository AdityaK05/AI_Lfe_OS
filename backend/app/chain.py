import logging
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from app.config import get_settings
from app.llm_router import LLMRouter
from app.models import Message
logger = logging.getLogger(__name__)
SYSTEM_PROMPT = "You are Nova — an advanced personal AI operating system.\n\nYou are intelligent, proactive, and efficient. You speak with calm confidence\nand subtle wit, like a brilliant assistant who genuinely cares about the user's\nsuccess. You adapt your communication style to the context: technical when\ndiscussing code, warm when the user needs support, concise when they're busy.\n\nCore behaviors:\n- Give direct, actionable answers. Avoid unnecessary preamble.\n- When you don't know something, say so honestly.\n- Use markdown formatting for structured responses.\n- Remember context from the conversation and build on it.\n- Be opinionated when asked for recommendations — justify your choices.\n\nYou are Module 1 of the AI Life OS — the Core Intelligence Layer."
_memory_store: dict[str, list[dict]] = {}

def _get_user_memory(user_id: str) -> list[dict]:
    if user_id not in _memory_store:
        _memory_store[user_id] = []
    return _memory_store[user_id]

def _trim_memory(memory: list[dict], window: int) -> list[dict]:
    max_messages = window * 2
    if len(memory) > max_messages:
        return memory[-max_messages:]
    return memory

def _convert_to_langchain_messages(messages: list[dict]) -> list:
    lc_messages = []
    for msg in messages:
        role = msg['role']
        content = msg['content']
        if role == 'user':
            lc_messages.append(HumanMessage(content=content))
        elif role == 'assistant':
            lc_messages.append(AIMessage(content=content))
        elif role == 'system':
            lc_messages.append(SystemMessage(content=content))
    return lc_messages

async def stream_chat(messages: list[Message], model_name: str, user_id: str):
    settings = get_settings()
    router = LLMRouter()
    memory = _get_user_memory(user_id)
    new_messages = [{'role': m.role, 'content': m.content} for m in messages]
    full_history = memory + new_messages
    full_history = _trim_memory(full_history, settings.memory_window)
    lc_messages = [SystemMessage(content=SYSTEM_PROMPT)]
    lc_messages += _convert_to_langchain_messages(full_history)
    logger.info('Streaming for user=%s model=%s history=%d messages', user_id, model_name, len(full_history))
    full_response = ''
    async for token in router.stream_with_fallback(model_name, lc_messages):
        full_response += token
        yield token
    for msg in new_messages:
        if msg not in memory:
            memory.append(msg)
    memory.append({'role': 'assistant', 'content': full_response})
    _memory_store[user_id] = _trim_memory(memory, settings.memory_window)

def clear_memory(user_id: str) -> bool:
    if user_id in _memory_store:
        del _memory_store[user_id]
        return True
    return False