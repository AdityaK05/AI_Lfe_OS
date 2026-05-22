"""
AI Life OS — Configuration
Loads settings from environment variables / .env file.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from .env or environment."""

    # Groq Cloud API
    groq_api_key: str = ""

    # Ollama Local Server
    ollama_base_url: str = "http://localhost:11434"

    # Defaults
    default_model: str = "groq/llama-3.3-70b-versatile"
    cors_origins: str = "http://localhost:3000"

    # Conversation memory
    memory_window: int = 10

    # ChromaDB (Module 2 — Long-Term Memory)
    chroma_persist_dir: str = "./data/chromadb"
    embedding_model: str = "all-MiniLM-L6-v2"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def has_groq_key(self) -> bool:
        """Check if a valid Groq API key is configured."""
        return bool(self.groq_api_key and self.groq_api_key != "gsk_your_key_here")


@lru_cache
def get_settings() -> Settings:
    """Cached singleton for app settings."""
    return Settings()
