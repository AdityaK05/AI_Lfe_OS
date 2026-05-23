"""
AI Life OS — Tool Registry (Module 4)
Registers MCP tools as LangChain tools.
"""

from langchain_core.tools import tool
from app.tools.gmail_tool import get_inbox, search_emails, draft_reply, send_email
from app.tools.calendar_tool import list_events, create_event, check_free_slots
from app.tools.notion_tool import get_pages, create_page, append_block
from app.tools.productivity_tools import create_task, list_tasks, create_routine

# Gmail Tools
@tool
def gmail_get_inbox(limit: int = 10):
    """Retrieve the most recent emails from the user's Gmail inbox."""
    return get_inbox(limit)

@tool
def gmail_search_emails(query: str):
    """Search for emails in Gmail using standard query syntax."""
    return search_emails(query)

@tool
def gmail_draft_reply(thread_id: str, body: str):
    """Draft a reply to a specific email thread."""
    return draft_reply(thread_id, body)

@tool
def gmail_send_email(to: str, subject: str, body: str):
    """Send an email immediately to the specified address."""
    return send_email(to, subject, body)

# Calendar Tools
@tool
def cal_list_events(days: int = 7):
    """List upcoming calendar events for the next X days."""
    return list_events(days)

@tool
def cal_create_event(title: str, start: str, end: str, description: str = ""):
    """Create a new calendar event. Start and end must be ISO format strings."""
    return create_event(title, start, end, description)

@tool
def cal_check_free_slots(date: str):
    """Check free/busy slots on a specific date (ISO format string)."""
    return check_free_slots(date)

# Notion Tools
@tool
def notion_get_pages(database_id: str):
    """Get pages from a specific Notion database."""
    return get_pages(database_id)

@tool
def notion_create_page(title: str, content: str, parent_page_id: str):
    """Create a new Notion page as a child of parent_page_id."""
    return create_page(title, content, parent_page_id)

@tool
def notion_append_block(page_id: str, text: str):
    """Append a paragraph block to an existing Notion page."""
    return append_block(page_id, text)

def get_tools(user_id: str):
    """Return all tools. In a multi-tenant app, user_id can scope credentials here."""
    return [
        gmail_get_inbox, gmail_search_emails, gmail_draft_reply, gmail_send_email,
        cal_list_events, cal_create_event, cal_check_free_slots,
        notion_get_pages, notion_create_page, notion_append_block,
        create_task, list_tasks, create_routine
    ]
