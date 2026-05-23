"""
AI Life OS — Research Agent (Module 3)
Uses DuckDuckGo to search the web and summarize findings.
"""

import logging
from duckduckgo_search import DDGS
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field

from app.state_schema import AgentState
from app.llm_router import LLMRouter
from app.config import get_settings

logger = logging.getLogger(__name__)

class SearchQuery(BaseModel):
    query: str = Field(description="The search query to send to the search engine.")

RESEARCH_PROMPT = """You are the Nova Research Agent.
Determine the best search query to fulfill the user's request.
Return ONLY the search query string, nothing else.
"""

SUMMARIZE_PROMPT = """You are the Nova Research Agent.
Summarize the following search results in 3-5 concise bullet points.
Include the most relevant facts and append source URLs if available.
"""

async def research_node(state: AgentState) -> dict:
    """Extracts query, searches DDG, and summarizes results."""
    logger.info("Agent: RESEARCH")
    
    messages = state.get("messages", [])
    if not messages:
        return {}
        
    router = LLMRouter()
    settings = get_settings()
    llm = router.get_llm(settings.default_model)
    
    # 1. Generate search query
    try:
        query_llm = llm.with_structured_output(SearchQuery)
        res = await query_llm.ainvoke([SystemMessage(content=RESEARCH_PROMPT)] + list(messages[-2:]))
        search_query = res.query
    except Exception:
        # Fallback
        res = await llm.ainvoke([SystemMessage(content=RESEARCH_PROMPT)] + list(messages[-2:]))
        search_query = res.content.strip().strip('"\'')
        
    logger.info(f"Researching: {search_query}")
    
    # 2. Perform search
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(search_query, max_results=5))
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return {"tool_results": [f"Search failed: {e}"]}
        
    if not results:
        return {"tool_results": ["Search returned no results."]}
        
    # 3. Summarize results
    search_context = "SEARCH RESULTS:\n"
    for r in results:
        search_context += f"- {r.get('title')}: {r.get('body')} (Source: {r.get('href')})\n"
        
    summary_resp = await llm.ainvoke([
        SystemMessage(content=SUMMARIZE_PROMPT),
        HumanMessage(content=search_context)
    ])
    
    tool_result = f"RESEARCH SUMMARY for '{search_query}':\n{summary_resp.content}"
    
    return {
        "active_agent": "RESEARCH",
        "tool_results": [tool_result]
    }
