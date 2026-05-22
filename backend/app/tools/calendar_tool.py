"""
AI Life OS — Google Calendar MCP Tool (Module 4)
Provides read/write access to Google Calendar.
"""
import os
import logging
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

load_dotenv()

logger = logging.getLogger(__name__)

def _get_calendar_service():
    token = os.environ.get("GOOGLE_ACCESS_TOKEN")
    refresh_token = os.environ.get("GOOGLE_REFRESH_TOKEN")
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    
    if not all([token, refresh_token, client_id, client_secret]):
        raise ValueError("Missing Google OAuth environment variables")
        
    creds = Credentials(
        token=token, refresh_token=refresh_token,
        client_id=client_id, client_secret=client_secret,
        token_uri="https://oauth2.googleapis.com/token"
    )
    return build('calendar', 'v3', credentials=creds)

def list_events(days: int = 7) -> list[dict]:
    """List upcoming calendar events for the next X days."""
    try:
        service = _get_calendar_service()
        now = datetime.now(timezone.utc).isoformat()
        end = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
        
        events_result = service.events().list(
            calendarId='primary', timeMin=now, timeMax=end,
            maxResults=50, singleEvents=True, orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])
        
        structured_events = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end_t = event['end'].get('dateTime', event['end'].get('date'))
            structured_events.append({
                "id": event['id'],
                "summary": event.get('summary', 'Untitled'),
                "start": start,
                "end": end_t
            })
        return structured_events
    except Exception as e:
        logger.error(f"Calendar list error: {e}")
        return [{"error": str(e)}]

def create_event(title: str, start: str, end: str, description: str = "") -> dict:
    """Create a new calendar event. Start and end must be ISO strings."""
    try:
        service = _get_calendar_service()
        event = {
            'summary': title,
            'description': description,
            'start': {'dateTime': start, 'timeZone': 'UTC'},
            'end': {'dateTime': end, 'timeZone': 'UTC'},
        }
        event = service.events().insert(calendarId='primary', body=event).execute()
        return {"status": "Event created", "link": event.get('htmlLink')}
    except Exception as e:
        logger.error(f"Calendar create error: {e}")
        return {"error": str(e)}

def check_free_slots(date: str) -> dict:
    """Check free/busy slots on a specific date (ISO format string)."""
    try:
        service = _get_calendar_service()
        start_time = datetime.fromisoformat(date).replace(hour=0, minute=0, second=0).isoformat() + 'Z'
        end_time = datetime.fromisoformat(date).replace(hour=23, minute=59, second=59).isoformat() + 'Z'
        
        body = {
            "timeMin": start_time,
            "timeMax": end_time,
            "items": [{"id": "primary"}]
        }
        events_result = service.freebusy().query(body=body).execute()
        busy = events_result['calendars']['primary']['busy']
        return {"busy_slots": busy, "message": "Assume free time outside these slots."}
    except Exception as e:
        logger.error(f"Calendar freebusy error: {e}")
        return {"error": str(e)}
