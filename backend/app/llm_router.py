"""
AI Life OS — LLM Router
Routes requests to Groq (cloud) or Ollama (local) with retry + fallback.
"""

import asyncio
import logging
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama
from langchain_core.language_models import BaseChatModel

from app.config import get_settings

logger = logging.getLogger(__name__)

# ── Supported model registry ──────────────────────────────────────────
PROVIDER_MAP: dict[str, dict] = {
    "groq/deepseek-r1-distill-llama-70b": {
        "provider": "groq",
        "model_id": "deepseek-r1-distill-llama-70b",
    },
    "groq/llama-3.3-70b-versatile": {
        "provider": "groq",
        "model_id": "llama-3.3-70b-versatile",
    },
    "ollama/llama3": {
        "provider": "ollama",
        "model_id": "llama3",
    },
    "ollama/mistral": {
        "provider": "ollama",
        "model_id": "mistral",
    },
}

FALLBACK_MODEL = "ollama/llama3"


class LLMRouter:
    """
    Selects the right LLM provider based on model name.
    Handles retries for Groq rate limits and automatic Ollama fallback.
    """

    def __init__(self):
        self.settings = get_settings()
        self._max_retries = 2
        self._base_delay = 1.0  # seconds

    # ── Public API ────────────────────────────────────────────────────

    def get_llm(self, model_name: str) -> BaseChatModel:
        """Instantiate the right LLM for a given model identifier."""
        entry = PROVIDER_MAP.get(model_name)
        if not entry:
            raise ValueError(
                f"Unknown model '{model_name}'. "
                f"Supported: {list(PROVIDER_MAP.keys())}"
            )

        provider = entry["provider"]
        model_id = entry["model_id"]

        if provider == "groq":
            return self._build_groq(model_id)
        elif provider == "ollama":
            return self._build_ollama(model_id)
        else:
            raise ValueError(f"Unknown provider: {provider}")

    async def stream_with_fallback(self, model_name: str, messages: list):
        """
        Stream tokens from the chosen model.
        On Groq failure → retry up to 2× → fall back to Ollama.
        Yields string tokens.
        """
        try:
            async for token in self._stream_with_retry(model_name, messages):
                yield token
        except Exception as e:
            if model_name.startswith("groq/") and model_name != FALLBACK_MODEL:
                logger.warning(
                    "Groq failed after retries (%s), falling back to %s",
                    e, FALLBACK_MODEL,
                )
                async for token in self._stream_direct(FALLBACK_MODEL, messages):
                    yield token
            else:
                raise

    # ── Internal helpers ──────────────────────────────────────────────

    async def _stream_with_retry(self, model_name: str, messages: list):
        """Retry loop with exponential backoff for Groq rate limits."""
        last_error = None

        for attempt in range(self._max_retries + 1):
            try:
                async for token in self._stream_direct(model_name, messages):
                    yield token
                return  # success — exit retry loop
            except Exception as e:
                last_error = e
                if attempt < self._max_retries:
                    delay = self._base_delay * (2 ** attempt)
                    logger.info(
                        "Retry %d/%d for %s in %.1fs",
                        attempt + 1, self._max_retries, model_name, delay,
                    )
                    await asyncio.sleep(delay)

        raise last_error  # type: ignore[misc]

    async def _stream_direct(self, model_name: str, messages: list):
        """Stream tokens from a single model (no retry)."""
        llm = self.get_llm(model_name)
        async for chunk in llm.astream(messages):
            if chunk.content:
                yield chunk.content

    def _build_groq(self, model_id: str) -> BaseChatModel:
        """Build a Groq-backed LLM."""
        if not self.settings.has_groq_key:
            raise ConnectionError(
                "Groq API key not configured. "
                "Set GROQ_API_KEY in .env or use an Ollama model."
            )
        return ChatGroq(
            model=model_id,
            api_key=self.settings.groq_api_key,
            temperature=0.7,
            streaming=True,
        )

    def _build_ollama(self, model_id: str) -> BaseChatModel:
        """Build an Ollama-backed LLM."""
        return ChatOllama(
            model=model_id,
            base_url=self.settings.ollama_base_url,
            temperature=0.7,
        )


def get_supported_models() -> list[dict]:
    """Return list of supported models with metadata for the frontend."""
    models = []
    settings = get_settings()
    for key, entry in PROVIDER_MAP.items():
        models.append({
            "id": key,
            "provider": entry["provider"],
            "model_id": entry["model_id"],
            "available": (
                settings.has_groq_key if entry["provider"] == "groq" else True
            ),
        })
    return models
