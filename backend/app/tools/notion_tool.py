import os
import httpx
import logging
from dotenv import load_dotenv
load_dotenv()
logger = logging.getLogger(__name__)

def _get_headers():
    notion_token = os.environ.get('NOTION_API_KEY')
    if not notion_token:
        raise ValueError('Missing NOTION_API_KEY')
    return {'Authorization': f'Bearer {notion_token}', 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28'}

def get_pages(database_id: str) -> list[dict]:
    try:
        headers = _get_headers()
        url = f'https://api.notion.com/v1/databases/{database_id}/query'
        with httpx.Client() as client:
            res = client.post(url, headers=headers)
            res.raise_for_status()
            results = res.json().get('results', [])
            pages = []
            for page in results:
                title_prop = page['properties'].get('Name', {}).get('title', [])
                title = title_prop[0]['plain_text'] if title_prop else 'Untitled'
                pages.append({'id': page['id'], 'title': title, 'url': page.get('url')})
            return pages
    except Exception as e:
        logger.error(f'Notion get_pages error: {e}')
        return [{'error': str(e)}]

def create_page(title: str, content: str, parent_page_id: str) -> dict:
    try:
        headers = _get_headers()
        url = 'https://api.notion.com/v1/pages'
        payload = {'parent': {'page_id': parent_page_id}, 'properties': {'title': [{'text': {'content': title}}]}, 'children': [{'object': 'block', 'type': 'paragraph', 'paragraph': {'rich_text': [{'type': 'text', 'text': {'content': content}}]}}]}
        with httpx.Client() as client:
            res = client.post(url, headers=headers, json=payload)
            res.raise_for_status()
            return {'status': 'Page created', 'id': res.json()['id']}
    except Exception as e:
        logger.error(f'Notion create_page error: {e}')
        return {'error': str(e)}

def append_block(page_id: str, text: str) -> dict:
    try:
        headers = _get_headers()
        url = f'https://api.notion.com/v1/blocks/{page_id}/children'
        payload = {'children': [{'object': 'block', 'type': 'paragraph', 'paragraph': {'rich_text': [{'type': 'text', 'text': {'content': text}}]}}]}
        with httpx.Client() as client:
            res = client.patch(url, headers=headers, json=payload)
            res.raise_for_status()
            return {'status': 'Block appended'}
    except Exception as e:
        logger.error(f'Notion append_block error: {e}')
        return {'error': str(e)}