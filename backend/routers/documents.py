"""Document management API endpoints."""

import json
import os
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.models.database import get_db, Document, DocumentMetadata, TimelineEvent
from backend.models.schemas import (
    DocumentUploadResponse,
    DocumentSaveRequest,
    DocumentResponse,
    DocumentListResponse,
)
from backend.services.document_processor import get_document_processor
from backend.services.knowledge_base import get_knowledge_base_service
from backend.services.document_intelligence import get_document_intelligence_service
from backend.config import get_settings

router = APIRouter()


def _parse_date(date_str: str | None) -> datetime | None:
    """Parse ISO date string to datetime."""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        return None


def _build_document_response(doc: Document) -> DocumentResponse:
    """Build DocumentResponse from Document with metadata."""
    response_data = {
        "id": doc.id,
        "filename": doc.filename,
        "original_filename": doc.original_filename,
        "file_type": doc.file_type,
        "file_size": doc.file_size,
        "content_preview": doc.content_preview,
        "chunk_count": doc.chunk_count,
        "is_indexed": doc.is_indexed,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
    }

    # Add metadata fields if available
    if doc.doc_metadata:
        response_data.update({
            "generated_name": doc.doc_metadata.generated_name,
            "summary": doc.doc_metadata.summary,
            "document_type": doc.doc_metadata.document_type,
            "primary_date": doc.doc_metadata.primary_date,
            "companies": json.loads(doc.doc_metadata.companies) if doc.doc_metadata.companies else [],
            "people": json.loads(doc.doc_metadata.people) if doc.doc_metadata.people else [],
            "is_timeless": doc.doc_metadata.is_timeless,
            "needs_date_input": doc.doc_metadata.date_uncertain,
        })

    return DocumentResponse(**response_data)


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a document for preview before saving to knowledge base."""
    processor = get_document_processor()

    if not processor.is_supported(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: {list(processor.SUPPORTED_TYPES.keys())}",
        )

    content = await file.read()
    result = await processor.process_upload(content, file.filename)

    return DocumentUploadResponse(
        upload_id=result["upload_id"],
        filename=result["filename"],
        file_type=result["file_type"],
        file_size=result["file_size"],
        preview=result["preview"],
        full_text_length=result["full_text_length"],
        message=f"Document '{file.filename}' processed. Would you like to save it to your knowledge base?",
    )


@router.post("/documents/save", response_model=DocumentResponse)
async def save_document(
    request: DocumentSaveRequest,
    db: AsyncSession = Depends(get_db),
):
    """Save an uploaded document to the knowledge base with LLM-powered metadata extraction."""
    processor = get_document_processor()
    kb = get_knowledge_base_service()
    intelligence = get_document_intelligence_service()
    settings = get_settings()

    temp_file = processor.get_temp_file(request.upload_id)
    if not temp_file:
        raise HTTPException(status_code=404, detail="Upload not found. Please upload the document again.")

    # Step 1: LLM Metadata Extraction
    extraction = await intelligence.extract_document_metadata(temp_file["full_text"])

    # Override with user-provided date if given
    if request.user_provided_date:
        extraction.primary_date = request.user_provided_date.strftime("%Y-%m-%d")
        extraction.date_uncertain = False

    # Step 2: Determine filename
    final_filename = request.custom_name or extraction.suggested_name or temp_file["filename"]

    # Step 3: Store original file for download
    stored_file_path = None
    if "content" in temp_file and temp_file["content"]:
        upload_dir = Path(settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Create unique directory for this upload
        file_dir = upload_dir / request.upload_id
        file_dir.mkdir(parents=True, exist_ok=True)

        # Save the original file
        file_path = file_dir / temp_file["filename"]
        with open(file_path, "wb") as f:
            f.write(temp_file["content"])
        stored_file_path = str(file_path)

    # Step 4: Create Document record
    doc = Document(
        filename=final_filename,
        original_filename=temp_file["filename"],
        file_type=temp_file["file_type"],
        file_size=temp_file["file_size"],
        content_preview=temp_file["preview"],
        full_text=temp_file["full_text"],
        stored_file_path=stored_file_path,
    )
    db.add(doc)
    await db.flush()

    # Step 5: Create DocumentMetadata record
    metadata = DocumentMetadata(
        document_id=doc.id,
        generated_name=extraction.suggested_name,
        summary=extraction.summary,
        document_type=extraction.document_type.value,
        is_timeless=extraction.is_timeless,
        primary_date=_parse_date(extraction.primary_date),
        date_range_start=_parse_date(extraction.date_range_start),
        date_range_end=_parse_date(extraction.date_range_end),
        date_uncertain=extraction.date_uncertain,
        companies=json.dumps(extraction.companies),
        people=json.dumps(extraction.people),
    )
    db.add(metadata)

    # Step 6: Create TimelineEvent records
    for event in extraction.events:
        event_date = _parse_date(event.date)
        if event_date:
            timeline_event = TimelineEvent(
                document_id=doc.id,
                event_date=event_date,
                event_type=event.event_type,
                title=event.title,
                description=event.description,
                companies=json.dumps(event.companies),
                people=json.dumps(event.people),
            )
            db.add(timeline_event)

    # Step 7: Index with time-aware chunks in Qdrant
    chunk_count = await kb.index_document_with_metadata(
        document_id=doc.id,
        filename=doc.filename,
        text=temp_file["full_text"],
        extraction=extraction,
    )

    doc.chunk_count = chunk_count
    doc.is_indexed = True

    await db.commit()

    # Refresh with relationships
    result = await db.execute(
        select(Document)
        .where(Document.id == doc.id)
        .options(selectinload(Document.doc_metadata))
    )
    doc = result.scalar_one()

    # Clean up temp file (but keep stored file)
    processor.remove_temp_file(request.upload_id)

    return _build_document_response(doc)


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(db: AsyncSession = Depends(get_db)):
    """List all documents in the knowledge base."""
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.doc_metadata))
        .order_by(Document.created_at.desc())
    )
    documents = result.scalars().all()

    return DocumentListResponse(
        documents=[_build_document_response(d) for d in documents],
        total_count=len(documents),
    )


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific document by ID."""
    result = await db.execute(
        select(Document)
        .where(Document.id == document_id)
        .options(selectinload(Document.doc_metadata))
    )
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return _build_document_response(doc)


@router.get("/documents/{document_id}/download")
async def download_document(document_id: int, db: AsyncSession = Depends(get_db)):
    """Download the original document file."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.stored_file_path or not os.path.exists(doc.stored_file_path):
        raise HTTPException(status_code=404, detail="Original file not available for download")

    return FileResponse(
        path=doc.stored_file_path,
        filename=doc.original_filename,
        media_type="application/octet-stream",
    )


@router.delete("/documents/{document_id}")
async def delete_document(document_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a document from the knowledge base."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove from vector store
    kb = get_knowledge_base_service()
    kb.delete_document(document_id)

    # Remove stored file if exists
    if doc.stored_file_path and os.path.exists(doc.stored_file_path):
        try:
            os.remove(doc.stored_file_path)
            # Also remove the directory if empty
            parent_dir = Path(doc.stored_file_path).parent
            if parent_dir.exists() and not any(parent_dir.iterdir()):
                parent_dir.rmdir()
        except OSError:
            pass  # Ignore file deletion errors

    # Remove from database (cascades to metadata and timeline_events)
    await db.delete(doc)
    await db.commit()

    return {"message": f"Document '{doc.filename}' deleted successfully"}
