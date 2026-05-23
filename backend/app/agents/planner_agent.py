"""
AI Life OS — Planner Agent (Module 3)
Breaks down complex goals into a step-by-step plan.
"""

import logging
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field

from app.state_schema import AgentState
from app.llm_router import LLMRouter
from app.config import get_settings

logger = logging.getLogger(__name__)

class PlanOutput(BaseModel):
    steps: list[str] = Field(
        description="A list of specific, actionable steps to achieve the goal."
    )

PLANNER_PROMPT = """You are the Nova Planning Agent.
The user has a complex goal. Break it down into a clear, actionable, step-by-step plan.
Each step should be specific and concise. Do not execute the plan, just create it.
"""

async def planner_node(state: AgentState) -> dict:
    """Generates a structured plan for the user's goal."""
    logger.info("Agent: PLANNER")
    
    messages = state.get("messages", [])
    if not messages:
        return {}
        
    router = LLMRouter()
    settings = get_settings()
    llm = router.get_llm(settings.default_model)
    
    try:
        planner_llm = llm.with_structured_output(PlanOutput)
        result = await planner_llm.ainvoke([
            SystemMessage(content=PLANNER_PROMPT),
        ] + list(messages[-3:])) # context of last few messages
        steps = result.steps
    except Exception as e:
        logger.warning(f"Planner structured output failed: {e}")
        resp = await llm.ainvoke([
            SystemMessage(content=PLANNER_PROMPT + "\n\nOutput a numbered list of steps."),
        ] + list(messages[-3:]))
        steps = [line for line in resp.content.split("\n") if line.strip()]
        
    formatted_plan = "\n".join(f"{i+1}. {step}" for i, step in enumerate(steps))
    tool_result = f"PLAN GENERATED:\n{formatted_plan}"
    
    return {
        "plan": steps,
        "active_agent": "PLANNER",
        "tool_results": [tool_result]
    }
