"""Configuration management for the chatbot application."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Keys
    anthropic_api_key: str = ""
    voyage_api_key: str = ""

    # Qdrant Configuration
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection_name: str = "knowledge_base"

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/chatbot.db"

    # Upload settings
    upload_dir: str = "./data/uploads"
    max_upload_size_mb: int = 50

    # Model settings
    claude_model: str = "claude-sonnet-4-5-20250929"
    embedding_model: str = "all-MiniLM-L6-v2"  # Local sentence-transformers model
    embedding_dimensions: int = 384  # all-MiniLM-L6-v2 dimensions

    # RAG settings
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k_results: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
