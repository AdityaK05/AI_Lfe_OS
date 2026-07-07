import logging
from langgraph.prebuilt import create_react_agent
from app.llm_router import LLMRouter
from app.config import get_settings
from app.tools.tool_registry import get_tools
logger = logging.getLogger(__name__)

def build_graph():
    router = LLMRouter()
    settings = get_settings()
    llm = router.get_llm(settings.default_model)
    tools = get_tools(user_id='default')
    system_prompt = "You are Nova — an advanced AI Operating System.\nYou have access to a suite of powerful tools including Gmail, Google Calendar, and Notion.\nYou can execute actions on the user's behalf. Always inform the user of the result of your actions."
    workflow = create_react_agent(llm, tools=tools, prompt=system_prompt)
    return workflow
graph = build_graph()