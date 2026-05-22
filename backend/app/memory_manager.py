"""
AI Life OS — Memory Manager (Module 2)
ChromaDB-backed semantic memory with per-user collections.
Uses HuggingFace all-MiniLM-L6-v2 embeddings (local, free).
"""

import logging
import time
import uuid
from functools import lru_cache

import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_huggingface import HuggingFaceEmbeddings

from app.config import get_settings

logger = logging.getLogger(__name__)

# ── Embedding model (cached singleton) ────────────────────────────────


@lru_cache(maxsize=1)
def get_embeddings() -> HuggingFaceEmbeddings:
    """Load HuggingFace embedding model once and cache it."""
    settings = get_settings()
    logger.info("Loading embedding model: %s", settings.embedding_model)
    return HuggingFaceEmbeddings(
        model_name=settings.embedding_model,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


# ── ChromaDB client (cached singleton) ────────────────────────────────


@lru_cache(maxsize=1)
def get_chroma_client() -> chromadb.ClientAPI:
    """Persistent ChromaDB client storing data on disk."""
    settings = get_settings()
    logger.info("Initializing ChromaDB at: %s", settings.chroma_persist_dir)
    return chromadb.PersistentClient(
        path=settings.chroma_persist_dir,
        settings=ChromaSettings(anonymized_telemetry=False),
    )


# ── Collection helpers ────────────────────────────────────────────────


def _collection_name(user_id: str, namespace: str = "memory") -> str:
    """Deterministic collection name per user + namespace."""
    # ChromaDB collection names: 3-63 chars, alphanumeric + underscores
    safe_id = user_id.replace("-", "_")[:40]
    return f"{namespace}_{safe_id}"


def _get_collection(user_id: str, namespace: str = "memory"):
    """Get or create a ChromaDB collection for a user."""
    client = get_chroma_client()
    name = _collection_name(user_id, namespace)
    return client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},
    )


# ── Public API ────────────────────────────────────────────────────────


def store_memory(
    user_id: str,
    text: str,
    metadata: dict | None = None,
) -> str:
    """
    Store a text memory with optional metadata.
    Returns the generated document ID.
    """
    collection = _get_collection(user_id, "memory")
    embeddings = get_embeddings()

    doc_id = f"mem_{uuid.uuid4().hex[:12]}"
    embedding = embeddings.embed_query(text)

    meta = {
        "type": "memory",
        "timestamp": time.time(),
        **(metadata or {}),
    }

    collection.add(
        ids=[doc_id],
        embeddings=[embedding],
        documents=[text],
        metadatas=[meta],
    )

    logger.info("Stored memory %s for user=%s (%d chars)", doc_id, user_id, len(text))
    return doc_id


def query_memory(
    user_id: str,
    query: str,
    k: int = 5,
    namespace: str = "memory",
) -> list[dict]:
    """
    Semantic search over user memories using cosine similarity.
    Returns top-k results with text, metadata, and distance.
    """
    collection = _get_collection(user_id, namespace)
    embeddings = get_embeddings()

    if collection.count() == 0:
        return []

    query_embedding = embeddings.embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    hits = []
    for i in range(len(results["ids"][0])):
        hits.append({
            "id": results["ids"][0][i],
            "text": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i],
        })

    logger.info(
        "Memory query for user=%s returned %d results (query: %.50s...)",
        user_id, len(hits), query,
    )
    return hits


def store_document_chunks(
    user_id: str,
    chunks: list[dict],
) -> int:
    """
    Batch-store document chunks into the 'documents' namespace.
    Each chunk dict must have: text, metadata.
    Returns count of chunks stored.
    """
    collection = _get_collection(user_id, "documents")
    embeddings = get_embeddings()

    ids = [f"doc_{uuid.uuid4().hex[:12]}" for _ in chunks]
    texts = [c["text"] for c in chunks]
    metas = [c["metadata"] for c in chunks]
    embeds = embeddings.embed_documents(texts)

    collection.add(ids=ids, embeddings=embeds, documents=texts, metadatas=metas)

    logger.info("Stored %d document chunks for user=%s", len(chunks), user_id)
    return len(chunks)


def list_user_documents(user_id: str) -> list[dict]:
    """List unique documents in the user's document collection."""
    collection = _get_collection(user_id, "documents")

    if collection.count() == 0:
        return []

    all_meta = collection.get(include=["metadatas"])
    seen = {}
    for meta in all_meta["metadatas"]:
        doc_id = meta.get("doc_id", "unknown")
        if doc_id not in seen:
            seen[doc_id] = {
                "doc_id": doc_id,
                "title": meta.get("title", "Untitled"),
                "source": meta.get("source", "unknown"),
                "chunks": 0,
            }
        seen[doc_id]["chunks"] += 1

    return list(seen.values())
