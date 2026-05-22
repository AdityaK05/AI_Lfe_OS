"""
AI Life OS — Orchestrator Node (Module 3)
Classifies user intent and routes to the appropriate specialized agent.
"""

import logging
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage

from app.state_schema import AgentState, AgentType
from app.llm_router import LLMRouter
from app.config import get_settings

logger = logging.getLogger(__name__)

# Pydantic schema for structured output from the LLM
class IntentClassification(BaseModel):
    intent: AgentType = Field(
        description="The classified intent of the user's message."
    )

ORCHESTRATOR_PROMPT = """You are the JARVIS Orchestrator.
Your job is to read the user's latest message and classify their intent into exactly one of these categories:

- PLANNER: The user wants to plan a complex task, project, or schedule.
- RESEARCH: The user is asking for current events, facts, or requires web search.
- PRODUCTIVITY: The user wants to manage tasks, to-dos, or productivity tools.
- KNOWLEDGE: The user is asking about personal notes, uploaded documents, or memory.
- RESPONDER: General conversation, greetings, or simple tasks that need no special tools.

Analyze the user's message and select the most appropriate intent.
"""

async def orchestrator_node(state: AgentState) -> dict:
    """
    Analyzes the conversation and classifies intent to route to the correct agent.
    """
    logger.info("Agent: ORCHESTRATOR")
    
    # Extract the last user message
    messages = state.get("messages", [])
    if not messages:
        return {"intent": AgentType.RESPONDER}
        
    last_user_msg = None
    for msg in reversed(messages):
        if getattr(msg, "type", "") == "user" or isinstance(msg, HumanMessage):
            last_user_msg = msg.content
            break
            
    if not last_user_msg:
        return {"intent": AgentType.RESPONDER}

    # Use LLM for classification
    router = LLMRouter()
    settings = get_settings()
    llm = router.get_llm(settings.default_model)
    
    # Try structured output (supported by Groq Llama 3 models)
    try:
        classifier = llm.with_structured_output(IntentClassification)
        result = await classifier.ainvoke([
            SystemMessage(content=ORCHESTRATOR_PROMPT),
            HumanMessage(content=last_user_msg)
        ])
        intent = result.intent
    except Exception as e:
        logger.warning(f"Structured output failed ({e}), falling back to string parsing.")
        # Fallback to standard generation
        fallback_prompt = ORCHESTRATOR_PROMPT + "\n\nReply ONLY with the exact word (e.g., RESEARCH)."
        resp = await llm.ainvoke([
            SystemMessage(content=fallback_prompt),
            HumanMessage(content=last_user_msg)
        ])
        intent_str = resp.content.strip().upper()
        try:
            intent = AgentType(intent_str)
        except ValueError:
            intent = AgentType.RESPONDER

    logger.info(f"Classified intent: {intent}")
    
    # Log handoff to metadata
    metadata = state.get("metadata", {})
    metadata["last_handoff"] = f"ORCHESTRATOR -> {intent.name}"
    
    return {
        "intent": intent,
        "active_agent": "ORCHESTRATOR",
        "metadata": metadata
    }
