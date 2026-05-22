"""
AI Life OS — RAG Chain (Module 2)
Retrieval-Augmented Generation: retrieves relevant chunks via MMR
and injects them into the LLM prompt before generation.
"""

import logging
from langchain_core.messages import SystemMessage

from app.config import get_settings
from app.llm_router import LLMRouter
from app.memory_manager import query_memory, get_embeddings, _get_collection
from app.models import Message

logger = logging.getLogger(__name__)

# ── RAG system prompt template ────────────────────────────────────────

RAG_SYSTEM_PROMPT = """You are JARVIS — an advanced personal AI operating system.

You have access to the user's personal knowledge base. Below is relevant context
retrieved from their documents and past conversations. Use this context to provide
informed, personalized responses.

RETRIEVED CONTEXT:
{context}

INSTRUCTIONS:
- Use the retrieved context when it is relevant to the user's question.
- If the context does not contain the answer, say so and answer from general knowledge.
- Always cite the source document when using retrieved information.
- Do NOT fabricate information that isn't in the context or your training data.
- Use markdown formatting for structured responses.
- Be direct and actionable."""


# ── MMR retrieval ─────────────────────────────────────────────────────


def _mmr_rerank(
    query_embedding: list[float],
    results: list[dict],
    k: int = 5,
    lambda_mult: float = 0.7,
) -> list[dict]:
    """
    Maximal Marginal Relevance re-ranking for diversity.
    Balances relevance (to query) vs diversity (between results).
    """
    if len(results) <= k:
        return results

    import numpy as np

    query_vec = np.array(query_embedding)
    doc_vecs = []
    for r in results:
        if "embedding" in r:
            doc_vecs.append(np.array(r["embedding"]))
        else:
            # Fallback: use distance as proxy (lower = more similar)
            doc_vecs.append(query_vec)  # will just use relevance score

    selected = []
    remaining = list(range(len(results)))

    for _ in range(min(k, len(results))):
        best_idx = None
        best_score = -float("inf")

        for idx in remaining:
            # Relevance to query (use 1 - distance for cosine)
            relevance = 1 - results[idx].get("distance", 0.5)

            # Max similarity to already-selected docs
            max_sim = 0.0
            for sel_idx in selected:
                sim = 1 - abs(
                    results[idx].get("distance", 0.5)
                    - results[sel_idx].get("distance", 0.5)
                )
                max_sim = max(max_sim, sim)

            # MMR score
            score = lambda_mult * relevance - (1 - lambda_mult) * max_sim
            if score > best_score:
                best_score = score
                best_idx = idx

        if best_idx is not None:
            selected.append(best_idx)
            remaining.remove(best_idx)

    return [results[i] for i in selected]


# ── Context building ──────────────────────────────────────────────────


def _build_context(chunks: list[dict]) -> str:
    """Format retrieved chunks into a context string for the prompt."""
    if not chunks:
        return "(No relevant documents found in your knowledge base.)"

    parts = []
    for i, chunk in enumerate(chunks, 1):
        source = chunk.get("metadata", {}).get("source", "unknown")
        title = chunk.get("metadata", {}).get("title", "Untitled")
        text = chunk.get("text", "")
        parts.append(f"[{i}] Source: {title} ({source})\n{text}")

    return "\n\n---\n\n".join(parts)


# ── RAG-augmented retrieval ───────────────────────────────────────────


def retrieve_context(user_id: str, query: str, k: int = 5) -> list[dict]:
    """
    Retrieve relevant chunks from both memory and documents.
    Uses MMR for diversity-aware ranking.
    """
    # Query both namespaces
    memory_hits = query_memory(user_id, query, k=k * 2, namespace="memory")
    doc_hits = query_memory(user_id, query, k=k * 2, namespace="documents")

    # Combine and re-rank with MMR
    all_hits = memory_hits + doc_hits

    if not all_hits:
        return []

    embeddings = get_embeddings()
    query_embedding = embeddings.embed_query(query)

    return _mmr_rerank(query_embedding, all_hits, k=k)


# ── RAG-augmented streaming ──────────────────────────────────────────


async def stream_rag_chat(
    messages: list[Message],
    model_name: str,
    user_id: str,
):
    """
    Stream a RAG-augmented chat response.
    Retrieves context → injects into system prompt → streams from LLM.
    Yields string tokens.
    """
    router = LLMRouter()

    # Get the user's latest query
    last_user_msg = ""
    for msg in reversed(messages):
        if msg.role == "user":
            last_user_msg = msg.content
            break

    # Retrieve relevant context
    chunks = retrieve_context(user_id, last_user_msg, k=5)
    context_str = _build_context(chunks)

    logger.info(
        "RAG context: %d chunks retrieved for user=%s",
        len(chunks), user_id,
    )

    # Build system prompt with injected context
    system_prompt = RAG_SYSTEM_PROMPT.format(context=context_str)

    # Build LangChain messages
    from langchain_core.messages import HumanMessage, AIMessage

    lc_messages = [SystemMessage(content=system_prompt)]
    for msg in messages:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            lc_messages.append(AIMessage(content=msg.content))

    # Stream response
    async for token in router.stream_with_fallback(model_name, lc_messages):
        yield token
