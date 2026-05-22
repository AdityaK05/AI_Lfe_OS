"""
AI Life OS — Agent State Schema (Module 3)
TypedDict for LangGraph state and AgentType enums.
"""

import operator
from enum import Enum
from typing import Annotated, TypedDict, Sequence, Any
from langchain_core.messages import BaseMessage


class AgentType(str, Enum):
    """Available specialized agents."""
    ORCHESTRATOR = "ORCHESTRATOR"
    PLANNER = "PLANNER"
    RESEARCH = "RESEARCH"
    PRODUCTIVITY = "PRODUCTIVITY"
    KNOWLEDGE = "KNOWLEDGE"
    RESPONDER = "RESPONDER"


class AgentState(TypedDict):
    """
    State payload passed between agents in the LangGraph orchestration.
    Uses operator.add for messages and tool_results to append rather than overwrite.
    """
    # Conversation history + new messages
    messages: Annotated[Sequence[BaseMessage], operator.add]
    
    # Classification of current turn intent
    intent: AgentType
    
    # Step-by-step plan if a complex task is requested
    plan: list[str]
    
    # Which agent is currently active
    active_agent: str
    
    # Results from tools (searches, API calls)
    tool_results: Annotated[list[str], operator.add]
    
    # Relevant memories/documents injected for the current turn
    memory_context: str
    
    # Handoff logging, routing metadata, etc.
    metadata: dict[str, Any]
