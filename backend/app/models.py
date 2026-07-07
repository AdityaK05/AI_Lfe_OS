from pydantic import BaseModel, Field
from enum import Enum

class SupportedModel(str, Enum):
    GROQ_DEEPSEEK_R1 = 'groq/deepseek-r1-distill-llama-70b'
    GROQ_LLAMA3_70B = 'groq/llama-3.3-70b-versatile'
    OLLAMA_LLAMA3 = 'ollama/llama3'
    OLLAMA_MISTRAL = 'ollama/mistral'

class Message(BaseModel):
    role: str = Field(..., description="Message role: 'user', 'assistant', or 'system'", pattern='^(user|assistant|system)$')
    content: str = Field(..., min_length=1, description='Message content')

class ChatRequest(BaseModel):
    messages: list[Message] = Field(..., min_length=1)
    model: str = Field(default='groq/llama-3.3-70b-versatile', description="Model identifier in 'provider/model' format")
    user_id: str = Field(default='default', description='Unique user identifier for memory isolation')

class TokenEvent(BaseModel):
    token: str = ''
    done: bool = False
    error: str | None = None

class MemoryStoreRequest(BaseModel):
    user_id: str = Field(default='default')
    text: str = Field(..., min_length=1, description='Text to store as memory')
    metadata: dict = Field(default_factory=dict, description='Optional metadata')

class MemoryQueryRequest(BaseModel):
    user_id: str = Field(default='default')
    query: str = Field(..., min_length=1, description='Search query')
    k: int = Field(default=5, ge=1, le=20, description='Number of results')

class ChatRequestWithRAG(BaseModel):
    messages: list[Message] = Field(..., min_length=1)
    model: str = Field(default='groq/llama-3.3-70b-versatile')
    user_id: str = Field(default='default')
    use_rag: bool = Field(default=False, description='Enable RAG context retrieval')