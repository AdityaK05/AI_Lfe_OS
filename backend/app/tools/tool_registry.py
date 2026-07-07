from langchain_core.tools import tool
from app.tools.gmail_tool import get_inbox, search_emails, draft_reply, send_email
from app.tools.calendar_tool import list_events, create_event, check_free_slots
from app.tools.notion_tool import get_pages, create_page, append_block
from app.tools.productivity_tools import create_task, list_tasks, create_routine

@tool
def gmail_get_inbox(limit: int=10):
    return get_inbox(limit)

@tool
def gmail_search_emails(query: str):
    return search_emails(query)

@tool
def gmail_draft_reply(thread_id: str, body: str):
    return draft_reply(thread_id, body)

@tool
def gmail_send_email(to: str, subject: str, body: str):
    return send_email(to, subject, body)

@tool
def cal_list_events(days: int=7):
    return list_events(days)

@tool
def cal_create_event(title: str, start: str, end: str, description: str=''):
    return create_event(title, start, end, description)

@tool
def cal_check_free_slots(date: str):
    return check_free_slots(date)

@tool
def notion_get_pages(database_id: str):
    return get_pages(database_id)

@tool
def notion_create_page(title: str, content: str, parent_page_id: str):
    return create_page(title, content, parent_page_id)

@tool
def notion_append_block(page_id: str, text: str):
    return append_block(page_id, text)

def get_tools(user_id: str):
    return [gmail_get_inbox, gmail_search_emails, gmail_draft_reply, gmail_send_email, cal_list_events, cal_create_event, cal_check_free_slots, notion_get_pages, notion_create_page, notion_append_block, create_task, list_tasks, create_routine]