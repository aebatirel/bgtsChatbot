"""SQLAlchemy database models and session management."""

import uuid
from datetime import datetime
from typing import AsyncGenerator

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship

from backend.config import get_settings


class Base(DeclarativeBase):
    """Base class for all database models."""

    pass


class Document(Base):
    """Represents a document stored in the knowledge base."""

    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    content_preview = Column(Text)
    full_text = Column(Text)
    chunk_count = Column(Integer, default=0)
    is_indexed = Column(Boolean, default=False)
    stored_file_path = Column(String(500))  # Path to original file for download
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    doc_metadata = relationship(
        "DocumentMetadata", back_populates="document", uselist=False, cascade="all, delete-orphan"
    )
    timeline_events = relationship(
        "TimelineEvent", back_populates="document", cascade="all, delete-orphan"
    )
    chunks = relationship(
        "DocumentChunk", back_populates="document", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Document(id={self.id}, filename='{self.filename}')>"


class DocumentMetadata(Base):
    """LLM-extracted metadata for a document."""

    __tablename__ = "document_metadata"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(
        Integer, ForeignKey("documents.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # LLM-generated fields
    generated_name = Column(String(500))  # "Acme Corp Q4 Meeting Notes - Jan 2026"
    summary = Column(Text)
    document_type = Column(String(50))  # email_thread, meeting_notes, client_profile, etc.
    is_timeless = Column(Boolean, default=False)  # True for profiles, contact info

    # Extracted dates
    primary_date = Column(DateTime)
    date_range_start = Column(DateTime)
    date_range_end = Column(DateTime)
    date_uncertain = Column(Boolean, default=False)  # Triggers user prompt

    # Extracted entities (JSON arrays)
    companies = Column(Text)  # ["Acme Corp"]
    people = Column(Text)  # ["Sarah Chen", "David Kim"]

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    document = relationship("Document", back_populates="doc_metadata")

    def __repr__(self):
        return f"<DocumentMetadata(document_id={self.document_id}, type='{self.document_type}')>"


class TimelineEvent(Base):
    """Extracted timeline event from a document."""

    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(
        Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )

    event_date = Column(DateTime, nullable=False, index=True)
    event_type = Column(String(50))  # meeting, email, deadline, milestone, action_item
    title = Column(String(500), nullable=False)
    description = Column(Text)

    # Entity associations (JSON arrays)
    companies = Column(Text)
    people = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    document = relationship("Document", back_populates="timeline_events")

    def __repr__(self):
        return f"<TimelineEvent(id={self.id}, title='{self.title[:30]}...')>"


class Conversation(Base):
    """Represents a chat conversation session."""

    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), default="New Conversation")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conversation(id={self.id}, title='{self.title}')>"


class Message(Base):
    """Represents a single message in a conversation."""

    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    sources = Column(Text)  # JSON string of source documents used
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<Message(id={self.id}, role='{self.role}')>"


class DocumentChunk(Base):
    """Vector embedding chunk for a document (replaces Qdrant)."""

    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(
        Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Chunk content
    filename = Column(String(255), nullable=False)  # Document filename for source attribution
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)

    # Vector embedding (384 dimensions for all-MiniLM-L6-v2)
    embedding = Column(Vector(384), nullable=False)

    # Time-aware metadata (previously in Qdrant payload)
    chunk_date = Column(DateTime, nullable=True)
    is_timeless = Column(Boolean, default=False)
    document_type = Column(String(50), nullable=True)
    companies = Column(ARRAY(String), default=[])
    people = Column(ARRAY(String), default=[])

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    document = relationship("Document", back_populates="chunks")

    def __repr__(self):
        return f"<DocumentChunk(id={self.id}, document_id={self.document_id}, chunk_index={self.chunk_index})>"


# Database engine and session setup
settings = get_settings()
engine = create_async_engine(settings.database_url, echo=False)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Initialize the database with pgvector extension and all tables."""
    async with engine.begin() as conn:
        # Enable pgvector extension
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides a database session."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
