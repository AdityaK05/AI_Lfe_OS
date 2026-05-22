"""
AI Life OS — Productivity Agent (Module 3)
Interacts with a Supabase REST API to manage tasks and lists.
"""

import os
import json
import httpx
import logging
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field

from app.state_schema import AgentState
from app.llm_router import LLMRouter
from app.config import get_settings

logger = logging.getLogger(__name__)

class TaskAction(BaseModel):
    action: str = Field(description="One of: 'CREATE', 'LIST', 'PRIORITIZE'")
    title: str | None = Field(default=None, description="Task title if creating")
    priority: str | None = Field(default="Medium", description="High, Medium, or Low")

PRODUCTIVITY_PROMPT = """You are the JARVIS Productivity Agent.
Extract the user's intent regarding task management.
Identify the action (CREATE, LIST, PRIORITIZE), and any task title/priority.
"""

async def productivity_node(state: AgentState) -> dict:
    """Manages tasks via Supabase REST API."""
    logger.info("Agent: PRODUCTIVITY")
    
    messages = state.get("messages", [])
    if not messages:
        return {}
        
    router = LLMRouter()
    settings = get_settings()
    llm = router.get_llm(settings.default_model)
    
    # Extract action
    try:
        action_llm = llm.with_structured_output(TaskAction)
        task_action = await action_llm.ainvoke([
            SystemMessage(content=PRODUCTIVITY_PROMPT)
        ] + list(messages[-2:]))
    except Exception:
        # Graceful fallback if structured output fails
        task_action = TaskAction(action="LIST")
        
    logger.info(f"Productivity action: {task_action.action}")
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    
    tool_result = ""
    
    if not supabase_url or not supabase_key:
        logger.warning("Supabase credentials missing. Mocking productivity action.")
        if task_action.action == "CREATE":
            tool_result = f"MOCK: Created task '{task_action.title}' (Priority: {task_action.priority})"
        else:
            tool_result = "MOCK: Task list: 1. Buy milk (High), 2. Write code (Medium)"
        return {"active_agent": "PRODUCTIVITY", "tool_results": [tool_result]}
        
    # Real Supabase integration
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    endpoint = f"{supabase_url}/rest/v1/tasks"
    
    async with httpx.AsyncClient() as client:
        try:
            if task_action.action == "CREATE" and task_action.title:
                payload = {"title": task_action.title, "priority": task_action.priority}
                res = await client.post(endpoint, headers=headers, json=payload)
                res.raise_for_status()
                tool_result = f"Task created successfully: {task_action.title}"
                
            elif task_action.action in ("LIST", "PRIORITIZE"):
                res = await client.get(f"{endpoint}?select=*", headers=headers)
                res.raise_for_status()
                tasks = res.json()
                if not tasks:
                    tool_result = "You have no pending tasks."
                else:
                    lines = [f"- [{t.get('priority', 'Medium')}] {t.get('title')}" for t in tasks]
                    tool_result = "CURRENT TASKS:\n" + "\n".join(lines)
        except Exception as e:
            logger.error(f"Supabase API error: {e}")
            tool_result = f"Failed to access tasks: {e}"
            
    return {
        "active_agent": "PRODUCTIVITY",
        "tool_results": [tool_result]
    }
