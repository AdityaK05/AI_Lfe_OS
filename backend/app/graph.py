import logging
from langgraph.prebuilt import create_react_agent
from app.llm_router import LLMRouter
from app.config import get_settings
from app.tools.tool_registry import get_tools
logger = logging.getLogger(__name__)

def get_graph(user_id: str):
    router = LLMRouter()
    settings = get_settings()
    llm = router.get_llm(settings.default_model)
    tools = get_tools(user_id=user_id)
    system_prompt = (
        "You are Nova — an advanced AI Operating System.\n"
        "You have access to a suite of powerful tools including Gmail, Google Calendar, Notion, and a personal Knowledge Base.\n"
        "CRITICAL: The user uploads files (like resumes or documents) via a separate dashboard interface. You do NOT receive file attachments directly in this chat. "
        "Therefore, if the user asks about their resume, their skills, or any uploaded documents, YOU MUST use the `search_knowledge_base` tool to search the vector database for this information.\n"
        "Do not tell the user you cannot access files; simply use the search_knowledge_base tool to find them.\n"
        "You can execute actions on the user's behalf. Always inform the user of the result of your actions."
    )
    workflow = create_react_agent(llm, tools=tools, prompt=system_prompt)
    return workflow