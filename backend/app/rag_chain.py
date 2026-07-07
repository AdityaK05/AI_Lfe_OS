import logging
from langchain_core.messages import SystemMessage
from app.config import get_settings
from app.llm_router import LLMRouter
from app.memory_manager import query_memory, get_embeddings, _get_collection
from app.models import Message
logger = logging.getLogger(__name__)
RAG_SYSTEM_PROMPT = "You are Nova — an advanced personal AI operating system.\n\nYou have access to the user's personal knowledge base. Below is relevant context\nretrieved from their documents and past conversations. Use this context to provide\ninformed, personalized responses.\n\nRETRIEVED CONTEXT:\n{context}\n\nINSTRUCTIONS:\n- Use the retrieved context when it is relevant to the user's question.\n- If the context does not contain the answer, say so and answer from general knowledge.\n- Always cite the source document when using retrieved information.\n- Do NOT fabricate information that isn't in the context or your training data.\n- Use markdown formatting for structured responses.\n- Be direct and actionable."

def _mmr_rerank(query_embedding: list[float], results: list[dict], k: int=5, lambda_mult: float=0.7) -> list[dict]:
    if len(results) <= k:
        return results
    import numpy as np
    query_vec = np.array(query_embedding)
    doc_vecs = []
    for r in results:
        if 'embedding' in r:
            doc_vecs.append(np.array(r['embedding']))
        else:
            doc_vecs.append(query_vec)
    selected = []
    remaining = list(range(len(results)))
    for _ in range(min(k, len(results))):
        best_idx = None
        best_score = -float('inf')
        for idx in remaining:
            relevance = 1 - results[idx].get('distance', 0.5)
            max_sim = 0.0
            for sel_idx in selected:
                sim = 1 - abs(results[idx].get('distance', 0.5) - results[sel_idx].get('distance', 0.5))
                max_sim = max(max_sim, sim)
            score = lambda_mult * relevance - (1 - lambda_mult) * max_sim
            if score > best_score:
                best_score = score
                best_idx = idx
        if best_idx is not None:
            selected.append(best_idx)
            remaining.remove(best_idx)
    return [results[i] for i in selected]

def _build_context(chunks: list[dict]) -> str:
    if not chunks:
        return '(No relevant documents found in your knowledge base.)'
    parts = []
    for i, chunk in enumerate(chunks, 1):
        source = chunk.get('metadata', {}).get('source', 'unknown')
        title = chunk.get('metadata', {}).get('title', 'Untitled')
        text = chunk.get('text', '')
        parts.append(f'[{i}] Source: {title} ({source})\n{text}')
    return '\n\n---\n\n'.join(parts)

def retrieve_context(user_id: str, query: str, k: int=5) -> list[dict]:
    memory_hits = query_memory(user_id, query, k=k * 2, namespace='memory')
    doc_hits = query_memory(user_id, query, k=k * 2, namespace='documents')
    all_hits = memory_hits + doc_hits
    if not all_hits:
        return []
    embeddings = get_embeddings()
    query_embedding = embeddings.embed_query(query)
    return _mmr_rerank(query_embedding, all_hits, k=k)

async def stream_rag_chat(messages: list[Message], model_name: str, user_id: str):
    router = LLMRouter()
    last_user_msg = ''
    for msg in reversed(messages):
        if msg.role == 'user':
            last_user_msg = msg.content
            break
    chunks = retrieve_context(user_id, last_user_msg, k=5)
    context_str = _build_context(chunks)
    logger.info('RAG context: %d chunks retrieved for user=%s', len(chunks), user_id)
    system_prompt = RAG_SYSTEM_PROMPT.format(context=context_str)
    from langchain_core.messages import HumanMessage, AIMessage
    lc_messages = [SystemMessage(content=system_prompt)]
    for msg in messages:
        if msg.role == 'user':
            lc_messages.append(HumanMessage(content=msg.content))
        elif msg.role == 'assistant':
            lc_messages.append(AIMessage(content=msg.content))
    async for token in router.stream_with_fallback(model_name, lc_messages):
        yield token