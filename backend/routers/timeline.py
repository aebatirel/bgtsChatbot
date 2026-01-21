"""Timeline API endpoints."""

import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from backend.models.database import get_db, TimelineEvent, Document, DocumentMetadata
from backend.models.schemas import TimelineResponse, TimelineEventResponse, CompaniesListResponse

router = APIRouter()


@router.get("/timeline", response_model=TimelineResponse)
async def get_timeline(
    db: AsyncSession = Depends(get_db),
    company: Optional[str] = Query(None, description="Filter by company name"),
    person: Optional[str] = Query(None, description="Filter by person name"),
    start_date: Optional[datetime] = Query(None, description="Filter events after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter events before this date"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
):
    """Get timeline events with optional filters."""
    # Build query with join to get document filename
    query = (
        select(TimelineEvent, Document.filename)
        .join(Document, TimelineEvent.document_id == Document.id)
    )

    # Apply filters
    conditions = []

    if start_date:
        conditions.append(TimelineEvent.event_date >= start_date)
    if end_date:
        conditions.append(TimelineEvent.event_date <= end_date)
    if event_type:
        conditions.append(TimelineEvent.event_type == event_type)
    if company:
        # JSON contains search - look for company in JSON array
        conditions.append(TimelineEvent.companies.contains(f'"{company}"'))
    if person:
        conditions.append(TimelineEvent.people.contains(f'"{person}"'))

    if conditions:
        query = query.where(and_(*conditions))

    # Order by date descending (most recent first)
    query = query.order_by(TimelineEvent.event_date.desc())
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    rows = result.all()

    events = []
    for event, doc_filename in rows:
        events.append(TimelineEventResponse(
            id=event.id,
            document_id=event.document_id,
            event_date=event.event_date,
            event_type=event.event_type or "other",
            title=event.title,
            description=event.description,
            companies=json.loads(event.companies) if event.companies else [],
            people=json.loads(event.people) if event.people else [],
            document_filename=doc_filename,
        ))

    # Get total count
    count_query = select(func.count(TimelineEvent.id))
    if conditions:
        count_query = count_query.where(and_(*conditions))
    count_result = await db.execute(count_query)
    total_count = count_result.scalar() or 0

    # Get date range
    date_range_query = select(
        func.min(TimelineEvent.event_date),
        func.max(TimelineEvent.event_date)
    )
    date_result = await db.execute(date_range_query)
    min_date, max_date = date_result.one()

    return TimelineResponse(
        events=events,
        total_count=total_count,
        date_range_start=min_date,
        date_range_end=max_date,
    )


@router.get("/timeline/companies", response_model=CompaniesListResponse)
async def get_companies(db: AsyncSession = Depends(get_db)):
    """Get list of all companies mentioned in documents."""
    # Get companies from DocumentMetadata
    result = await db.execute(
        select(DocumentMetadata.companies).where(DocumentMetadata.companies.isnot(None))
    )

    all_companies = set()
    for (companies_json,) in result:
        if companies_json:
            try:
                companies = json.loads(companies_json)
                all_companies.update(companies)
            except json.JSONDecodeError:
                pass

    return CompaniesListResponse(companies=sorted(list(all_companies)))


@router.get("/timeline/event-types")
async def get_event_types(db: AsyncSession = Depends(get_db)):
    """Get list of all event types."""
    result = await db.execute(
        select(TimelineEvent.event_type)
        .where(TimelineEvent.event_type.isnot(None))
        .distinct()
    )

    event_types = [row[0] for row in result if row[0]]
    return {"event_types": sorted(event_types)}
