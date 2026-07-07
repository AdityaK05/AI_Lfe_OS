from langchain_core.tools import tool
from app.tools.gmail_tool import get_inbox, search_emails, draft_reply, send_email
from app.tools.calendar_tool import list_events, create_event, check_free_slots
from app.tools.notion_tool import get_pages, create_page, append_block
from app.tools.productivity_tools import create_task, list_tasks, create_routine

@tool
def gmail_get_inbox(limit: int=10):
    """Fetch the latest emails from the user's Gmail inbox. Provide a limit to restrict the number of emails."""
    return get_inbox(limit)

@tool
def gmail_search_emails(query: str):
    """Search for emails in the user's Gmail using a search query (e.g., 'is:unread', 'from:boss@company.com')."""
    return search_emails(query)

@tool
def gmail_draft_reply(thread_id: str, body: str):
    """Draft a reply to an existing email thread in Gmail."""
    return draft_reply(thread_id, body)

@tool
def gmail_send_email(to: str, subject: str, body: str):
    """Send an email to a specific email address with a subject and body."""
    return send_email(to, subject, body)

@tool
def cal_list_events(days: int=7):
    """List upcoming calendar events for the next specified number of days."""
    return list_events(days)

@tool
def cal_create_event(title: str, start: str, end: str, description: str=''):
    """Create a new event in Google Calendar. Provide title, ISO start time, ISO end time, and an optional description."""
    return create_event(title, start, end, description)

@tool
def cal_check_free_slots(date: str):
    """Check for free time slots in the user's Google Calendar on a specific date (ISO format)."""
    return check_free_slots(date)

@tool
def notion_get_pages(database_id: str):
    """Get pages from a specific Notion database."""
    return get_pages(database_id)

@tool
def notion_create_page(title: str, content: str, parent_page_id: str):
    """Create a new page in Notion under a specific parent page ID."""
    return create_page(title, content, parent_page_id)

@tool
def notion_append_block(page_id: str, text: str):
    """Append a text block to an existing Notion page."""
    return append_block(page_id, text)

def get_tools(user_id: str):
    from langchain_core.tools import tool
    from app.rag_chain import retrieve_context, _build_context
    from pydantic import BaseModel, Field
    class SearchArgs(BaseModel):
        query: str = Field(description="The search query to look up in the vector database.")

    @tool(args_schema=SearchArgs)
    def search_knowledge_base(query: str) -> str:
        """Search the user's uploaded documents (like resumes) and past memories."""
        try:
            chunks = retrieve_context(user_id, query, k=5)
            return _build_context(chunks)
        except Exception as e:
            return f"Error retrieving from knowledge base: {str(e)}"

    return [
        search_knowledge_base,
        gmail_get_inbox, 
        gmail_search_emails, 
        gmail_draft_reply, 
        gmail_send_email, 
        cal_list_events, 
        cal_create_event, 
        cal_check_free_slots, 
        notion_get_pages, 
        notion_create_page, 
        notion_append_block, 
        create_task, 
        list_tasks, 
        create_routine
    ]