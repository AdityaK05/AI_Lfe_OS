import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.config import get_settings
from app.models import ChatRequestWithRAG, TokenEvent
from app.chain import stream_chat
from app.llm_router import get_supported_models
from app.rag_chain import stream_rag_chat
from app.routes_memory import router as memory_router
from app.clerk_middleware import ClerkMiddleware
from app.tools.calendar_tool import list_events as calendar_list_events
from app.tools.gmail_tool import get_inbox as gmail_get_inbox
from app.database import engine
from app import models_db
from app.routes_productivity import router as productivity_router
models_db.Base.metadata.create_all(bind=engine)
logging.basicConfig(level=logging.INFO, format='%(asctime)s │ %(name)-20s │ %(levelname)-7s │ %(message)s')
logger = logging.getLogger(__name__)
app = FastAPI(title='AI Life OS — Core Intelligence', description='Streaming conversational AI with smart LLM routing and RAG', version='0.2.0')
settings = get_settings()
app.add_middleware(ClerkMiddleware, public_routes=['/health', '/models', '/docs', '/openapi.json'])
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
app.include_router(memory_router)
app.include_router(productivity_router)

async def _sse_generator(request: ChatRequestWithRAG):
    try:
        if request.use_rag:
            # Fallback to standard chat since RAG is disabled due to memory constraints
            token_stream = stream_chat(messages=request.messages, model_name=request.model, user_id=request.user_id)
        else:
            token_stream = stream_chat(messages=request.messages, model_name=request.model, user_id=request.user_id)
        async for token in token_stream:
            event = TokenEvent(token=token, done=False)
            yield f'data: {event.model_dump_json()}\n\n'
        done_event = TokenEvent(token='', done=True)
        yield f'data: {done_event.model_dump_json()}\n\n'
    except (ValueError, ConnectionError) as e:
        error_event = TokenEvent(error=str(e), done=True)
        yield f'data: {error_event.model_dump_json()}\n\n'
    except Exception as e:
        logger.exception('Unexpected error during streaming')
        error_event = TokenEvent(error=f'Internal error: {type(e).__name__}', done=True)
        yield f'data: {error_event.model_dump_json()}\n\n'

@app.post('/chat')
async def chat(request: ChatRequestWithRAG):
    logger.info('Chat request: model=%s user=%s rag=%s msgs=%d', request.model, request.user_id, request.use_rag, len(request.messages))
    return StreamingResponse(_sse_generator(request), media_type='text/event-stream', headers={'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no'})

async def _agent_sse_generator(request: ChatRequestWithRAG):
    try:
        from langchain_core.messages import HumanMessage, AIMessage
        from app.graph import get_graph
        graph = get_graph(request.user_id)
        lc_messages = []
        for m in request.messages:
            if m.role == 'user':
                lc_messages.append(HumanMessage(content=m.content))
            elif m.role == 'assistant':
                lc_messages.append(AIMessage(content=m.content))
        initial_state = {'messages': lc_messages, 'tool_results': [], 'metadata': {}}
        async for event in graph.astream_events(initial_state, version='v1'):
            kind = event['event']
            if kind == 'on_chat_model_stream':
                node = event.get('metadata', {}).get('langgraph_node')
                if node == 'agent':
                    chunk = event['data']['chunk'].content
                    if isinstance(chunk, str) and chunk:
                        ev = TokenEvent(token=chunk, done=False)
                        yield f'data: {ev.model_dump_json()}\n\n'
        done_event = TokenEvent(token='', done=True)
        yield f'data: {done_event.model_dump_json()}\n\n'
    except Exception as e:
        logger.exception('Agent streaming error')
        error_event = TokenEvent(error=str(e), done=True)
        yield f'data: {error_event.model_dump_json()}\n\n'

@app.post('/agent/run')
async def agent_run(request: ChatRequestWithRAG):
    logger.info('Agent run request for user=%s', request.user_id)
    return StreamingResponse(_agent_sse_generator(request), media_type='text/event-stream', headers={'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no'})

@app.get('/models')
async def list_models():
    return {'models': get_supported_models()}

@app.get('/health')
async def health():
    return {'status': 'ok', 'service': 'ai-life-os-core', 'version': '0.2.0', 'groq_configured': settings.has_groq_key, 'modules': ['core-intelligence', 'long-term-memory']}

@app.get('/calendar/events')
async def get_calendar_events(days: int=7):
    try:
        events = calendar_list_events(days=days)
        if events and isinstance(events, list) and len(events) > 0 and 'error' in events[0]:
            return {'error': events[0]['error'], 'events': []}
        return {'events': events}
    except Exception as e:
        logger.error(f'Failed to fetch calendar events: {e}')
        return {'error': str(e), 'events': []}


@app.get('/api/emails')
async def api_get_emails():
    try:
        from app.tools.gmail_tool import search_emails, get_inbox
        emails = search_emails('is:unread')
        
        # Check if search returned an error or is empty
        if not emails or (isinstance(emails, list) and len(emails) > 0 and 'error' in emails[0]):
            emails = get_inbox(limit=5)
            
        if emails and isinstance(emails, list) and len(emails) > 0 and 'error' in emails[0]:
            raise ValueError(emails[0]['error'])
            
        return emails
    except Exception as e:
        logger.warning(f'Email fetch failed: {e}')
        return []