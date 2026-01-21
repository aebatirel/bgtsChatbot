"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    """Message role in a conversation."""

    USER = "user"
    ASSISTANT = "assistant"


class DocumentType(str, Enum):
    """Type of document for categorization."""

    EMAIL_THREAD = "email_thread"
    MEETING_NOTES = "meeting_notes"
    CLIENT_PROFILE = "client_profile"
    REPORT = "report"
    CONTRACT = "contract"
    PROPOSAL = "proposal"
    NOTES = "notes"
    OTHER = "other"


# ============================================================================
# LLM Extraction Schemas (for structured output)
# ============================================================================


class ExtractedEvent(BaseModel):
    """A single event extracted from the document for timeline."""

    date: str = Field(..., description="ISO 8601 date string (YYYY-MM-DD)")
    event_type: str = Field(
        ..., description="Type: meeting, email, deadline, milestone, action_item"
    )
    title: str = Field(..., description="Brief title of the event (max 100 chars)")
    description: Optional[str] = Field(None, description="Longer description if available")
    companies: list[str] = Field(default_factory=list, description="Companies involved")
    people: list[str] = Field(default_factory=list, description="People involved")


class DocumentExtraction(BaseModel):
    """Complete extraction result from LLM processing."""

    # Document metadata
    suggested_name: str = Field(
        ..., description="Descriptive name like 'Acme Corp Q4 Meeting Notes - Jan 2026'"
    )
    summary: str = Field(..., description="2-3 sentence summary of document contents")
    document_type: DocumentType = Field(..., description="Category of document")
    is_timeless: bool = Field(
        False, description="True if content is mostly timeless (profiles, contacts)"
    )

    # Date extraction
    primary_date: Optional[str] = Field(
        None, description="Main document date in ISO format (YYYY-MM-DD), null if uncertain"
    )
    date_range_start: Optional[str] = Field(
        None, description="Start date if document spans a range"
    )
    date_range_end: Optional[str] = Field(
        None, description="End date if document spans a range"
    )
    date_uncertain: bool = Field(
        False, description="True if dates should be present but couldn't be extracted"
    )

    # Entities
    companies: list[str] = Field(
        default_factory=list, description="Company/organization names found"
    )
    people: list[str] = Field(default_factory=list, description="People names found")

    # Timeline events
    events: list[ExtractedEvent] = Field(
        default_factory=list, description="Timeline events with dates"
    )


class ChatMessage(BaseModel):
    """A single chat message."""

    role: MessageRole
    content: str


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""

    message: str = Field(..., min_length=1, description="User message")
    conversation_id: Optional[int] = Field(None, description="Existing conversation ID")
    use_knowledge_base: bool = Field(True, description="Whether to search knowledge base")


class SourceDocument(BaseModel):
    """Reference to a source document used in a response."""

    document_id: int
    filename: str
    snippet: str
    relevance_score: float


class ChatResponse(BaseModel):
    """Response body for chat endpoint."""

    message: str
    conversation_id: int
    sources: list[SourceDocument] = Field(default_factory=list)


class DocumentUploadResponse(BaseModel):
    """Response after uploading a document for preview."""

    upload_id: str
    filename: str
    file_type: str
    file_size: int
    preview: str
    full_text_length: int
    message: str


class DocumentSaveRequest(BaseModel):
    """Request to save an uploaded document to knowledge base."""

    upload_id: str
    custom_name: Optional[str] = None
    user_provided_date: Optional[datetime] = Field(
        None, description="User-provided date when LLM couldn't extract one"
    )


class DocumentResponse(BaseModel):
    """Response representing a document in the knowledge base."""

    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    content_preview: Optional[str]
    chunk_count: int
    is_indexed: bool
    created_at: datetime
    updated_at: datetime

    # LLM-extracted metadata
    generated_name: Optional[str] = None
    summary: Optional[str] = None
    document_type: Optional[str] = None
    primary_date: Optional[datetime] = None
    companies: list[str] = Field(default_factory=list)
    people: list[str] = Field(default_factory=list)
    is_timeless: bool = False
    needs_date_input: bool = Field(
        False, description="True if frontend should prompt for date"
    )

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Response containing a list of documents."""

    documents: list[DocumentResponse]
    total_count: int


# ============================================================================
# Timeline Schemas
# ============================================================================


class TimelineEventResponse(BaseModel):
    """Response representing a timeline event."""

    id: int
    document_id: int
    event_date: datetime
    event_type: str
    title: str
    description: Optional[str]
    companies: list[str] = Field(default_factory=list)
    people: list[str] = Field(default_factory=list)
    document_filename: str  # For display

    class Config:
        from_attributes = True


class TimelineResponse(BaseModel):
    """Response containing timeline events."""

    events: list[TimelineEventResponse]
    total_count: int
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None


class CompaniesListResponse(BaseModel):
    """Response containing list of companies."""

    companies: list[str]


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str
    services: dict[str, str]
