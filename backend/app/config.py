from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    groq_api_key: str = ''
    ollama_base_url: str = 'http://localhost:11434'
    default_model: str = 'groq/llama-3.3-70b-versatile'
    cors_origins: str = 'http://localhost:3000'
    memory_window: int = 10
    chroma_persist_dir: str = './data/chromadb'
    embedding_model: str = 'all-MiniLM-L6-v2'
    model_config = {'env_file': '.env', 'env_file_encoding': 'utf-8', 'extra': 'ignore'}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(',')]

    @property
    def has_groq_key(self) -> bool:
        return bool(self.groq_api_key and self.groq_api_key != 'gsk_your_key_here')

@lru_cache
def get_settings() -> Settings:
    return Settings()