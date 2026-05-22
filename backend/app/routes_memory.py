"""
AI Life OS — Memory & Document Routes (Module 2)
FastAPI routes for semantic memory and document ingestion.
"""

import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.models import MemoryStoreRequest, MemoryQueryRequest
from app.memory_manager import store_memory, query_memory, list_user_documents
from app.document_ingestion import ingest_document
from app.chain import clear_memory

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Memory endpoints ─────────────────────────────────────────────────

@router.post("/memory/store")
async def api_store_memory(request: MemoryStoreRequest):
    """Store a text memory with optional metadata."""
    doc_id = store_memory(request.user_id, request.text, request.metadata)
    return {"id": doc_id, "status": "stored"}


@router.post("/memory/query")
async def api_query_memory(request: MemoryQueryRequest):
    """Semantic search over user memories."""
    results = query_memory(request.user_id, request.query, request.k)
    return {"results": results, "count": len(results)}


@router.delete("/memory/{user_id}")
async def delete_memory(user_id: str):
    """Clear conversation memory for a user."""
    cleared = clear_memory(user_id)
    return {"cleared": cleared, "user_id": user_id}


# ── Document endpoints ───────────────────────────────────────────────

@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(default="default"),
):
    """
    Upload and ingest a document (PDF, TXT, Markdown).
    Chunks, embeds, and stores in the user's knowledge base.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        result = ingest_document(user_id, file.filename, file_bytes)
        return {
            "doc_id": result.doc_id,
            "title": result.title,
            "source": result.source,
            "chunks_added": result.chunks_added,
            "total_chars": result.total_chars,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/documents/list")
async def api_list_documents(user_id: str = "default"):
    """List all documents in a user's knowledge base."""
    docs = list_user_documents(user_id)
    return {"documents": docs, "count": len(docs)}
