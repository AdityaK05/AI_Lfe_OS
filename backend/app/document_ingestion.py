"""
AI Life OS — Document Ingestion Pipeline (Module 2)
Accepts PDF, TXT, or Markdown files. Chunks and embeds into ChromaDB.
"""

import logging
import uuid
from pathlib import Path
from dataclasses import dataclass

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.memory_manager import store_document_chunks

logger = logging.getLogger(__name__)

# ── Supported formats ─────────────────────────────────────────────────

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md", ".markdown"}

# ── Text splitter (reusable) ──────────────────────────────────────────

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=64,
    length_function=len,
    separators=["\n\n", "\n", ". ", " ", ""],
    keep_separator=True,
)


@dataclass
class IngestionResult:
    """Result of a document ingestion operation."""

    doc_id: str
    title: str
    source: str
    chunks_added: int
    total_chars: int


# ── Text extractors ──────────────────────────────────────────────────


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file using PyPDF2."""
    from pypdf import PdfReader
    import io

    reader = PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())
    return "\n\n".join(pages)


def _extract_text_from_txt(file_bytes: bytes) -> str:
    """Decode plain text / markdown bytes."""
    # Try UTF-8 first, fall back to latin-1
    for encoding in ("utf-8", "latin-1"):
        try:
            return file_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue
    return file_bytes.decode("utf-8", errors="replace")


# ── Main ingestion function ──────────────────────────────────────────


def ingest_document(
    user_id: str,
    filename: str,
    file_bytes: bytes,
) -> IngestionResult:
    """
    Ingest a document: extract text → chunk → embed → store in ChromaDB.

    Args:
        user_id: Owner of the document.
        filename: Original filename (used for extension detection).
        file_bytes: Raw file content.

    Returns:
        IngestionResult with doc_id, chunk count, and stats.

    Raises:
        ValueError: If file format is unsupported or empty.
    """
    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file format '{ext}'. "
            f"Supported: {', '.join(SUPPORTED_EXTENSIONS)}"
        )

    # Extract text based on format
    if ext == ".pdf":
        raw_text = _extract_text_from_pdf(file_bytes)
    else:
        raw_text = _extract_text_from_txt(file_bytes)

    if not raw_text.strip():
        raise ValueError(f"No text content could be extracted from '{filename}'")

    # Generate document ID
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    title = Path(filename).stem

    logger.info(
        "Ingesting '%s' for user=%s (%d chars)",
        filename, user_id, len(raw_text),
    )

    # Chunk the text
    text_chunks = _splitter.split_text(raw_text)

    # Build chunk dicts with metadata
    chunks = []
    for idx, chunk_text in enumerate(text_chunks):
        chunks.append({
            "text": chunk_text,
            "metadata": {
                "doc_id": doc_id,
                "title": title,
                "source": filename,
                "chunk_index": idx,
                "total_chunks": len(text_chunks),
                "type": "document",
            },
        })

    # Store in ChromaDB via memory_manager
    stored = store_document_chunks(user_id, chunks)

    result = IngestionResult(
        doc_id=doc_id,
        title=title,
        source=filename,
        chunks_added=stored,
        total_chars=len(raw_text),
    )

    logger.info(
        "Ingestion complete: doc_id=%s chunks=%d chars=%d",
        result.doc_id, result.chunks_added, result.total_chars,
    )
    return result
