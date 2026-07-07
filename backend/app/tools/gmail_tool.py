import os
import logging
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
load_dotenv()
logger = logging.getLogger(__name__)

def _get_gmail_service():
    token = os.environ.get('GOOGLE_ACCESS_TOKEN')
    refresh_token = os.environ.get('GOOGLE_REFRESH_TOKEN')
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    if not all([token, refresh_token, client_id, client_secret]):
        raise ValueError('Missing Google OAuth environment variables')
    creds = Credentials(token=token, refresh_token=refresh_token, client_id=client_id, client_secret=client_secret, token_uri='https://oauth2.googleapis.com/token')
    return build('gmail', 'v1', credentials=creds)

def get_inbox(limit: int=10) -> list[dict]:
    try:
        service = _get_gmail_service()
        results = service.users().messages().list(userId='me', labelIds=['INBOX'], maxResults=limit).execute()
        messages = results.get('messages', [])
        emails = []
        for msg in messages:
            msg_data = service.users().messages().get(userId='me', id=msg['id'], format='metadata', metadataHeaders=['Subject', 'From', 'Date']).execute()
            headers = msg_data.get('payload', {}).get('headers', [])
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
            emails.append({'id': msg['id'], 'snippet': msg_data.get('snippet', ''), 'subject': subject, 'sender': sender, 'date': date})
        return emails
    except Exception as e:
        logger.error(f'Gmail get_inbox error: {e}')
        return [{'error': str(e)}]

def search_emails(query: str) -> list[dict]:
    try:
        service = _get_gmail_service()
        results = service.users().messages().list(userId='me', q=query, maxResults=5).execute()
        messages = results.get('messages', [])
        emails = []
        for msg in messages:
            msg_data = service.users().messages().get(userId='me', id=msg['id']).execute()
            snippet = msg_data.get('snippet', '')
            emails.append({'id': msg['id'], 'snippet': snippet})
        return emails
    except Exception as e:
        logger.error(f'Gmail search error: {e}')
        return [{'error': str(e)}]

def draft_reply(thread_id: str, body: str) -> dict:
    try:
        service = _get_gmail_service()
        from email.message import EmailMessage
        import base64
        message = EmailMessage()
        message.set_content(body)
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        draft = {'message': {'raw': encoded_message, 'threadId': thread_id}}
        draft_res = service.users().drafts().create(userId='me', body=draft).execute()
        return {'status': 'Draft created', 'draft_id': draft_res['id']}
    except Exception as e:
        logger.error(f'Gmail draft error: {e}')
        return {'error': str(e)}

def send_email(to: str, subject: str, body: str) -> dict:
    try:
        service = _get_gmail_service()
        from email.message import EmailMessage
        import base64
        message = EmailMessage()
        message.set_content(body)
        message['To'] = to
        message['Subject'] = subject
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        send_req = {'raw': encoded_message}
        res = service.users().messages().send(userId='me', body=send_req).execute()
        return {'status': 'Email sent successfully', 'message_id': res['id']}
    except Exception as e:
        logger.error(f'Gmail send error: {e}')
        return {'error': str(e)}