"""Knowledge base service for vector storage and retrieval using pgvector."""

from datetime import datetime
from typing import Optional

from sentence_transformers import SentenceTransformer
from sqlalchemy import select, delete, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import get_settings
from backend.utils.text_processing import chunk_text
from backend.models.schemas import DocumentExtraction
from backend.models.database import DocumentChunk, async_session_maker


class LocalEmbeddings:
    """Wrapper for local sentence-transformers embeddings."""

    def __init__(self, model: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model)

    async def aembed_documents(self, texts: list[str]) -> list[list[float]]:
        """Embed a list of documents."""
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()

    async def aembed_query(self, text: str) -> list[float]:
        """Embed a single query."""
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()


class KnowledgeBaseService:
    """Service for managing the vector knowledge base with pgvector."""

    def __init__(self):
        self.settings = get_settings()
        self._embeddings: Optional[LocalEmbeddings] = None

    @property
    def embeddings(self) -> LocalEmbeddings:
        """Get or create embeddings model."""
        if self._embeddings is None:
            self._embeddings = LocalEmbeddings(
                model=self.settings.embedding_model,
            )
        return self._embeddings

    async def index_document(
        self, document_id: int, filename: str, text: str, db: AsyncSession = None
    ) -> int:
        """Index a document into the knowledge base (basic version)."""
        chunks = chunk_text(text)

        if not chunks:
            return 0

        chunk_embeddings = await self.embeddings.aembed_documents(chunks)

        should_close = False
        if db is None:
            db = async_session_maker()
            should_close = True

        try:
            # Build all chunk records first, then bulk insert
            chunk_records = [
                DocumentChunk(
                    document_id=document_id,
                    filename=filename,
                    chunk_index=i,
                    text=chunk,
                    embedding=embedding,
                )
                for i, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings))
            ]
            db.add_all(chunk_records)
            await db.flush()
            if should_close:
                await db.commit()

            return len(chunks)
        finally:
            if should_close:
                await db.close()

    async def index_document_with_metadata(
        self,
        document_id: int,
        filename: str,
        text: str,
        extraction: DocumentExtraction,
        db: AsyncSession = None,
    ) -> int:
        """Index a document with time-aware metadata."""
        from backend.services.document_intelligence import get_document_intelligence_service

        chunks = chunk_text(text)

        if not chunks:
            return 0

        intelligence = get_document_intelligence_service()
        chunk_dates = intelligence.assign_chunk_dates(chunks, extraction)
        chunk_embeddings = await self.embeddings.aembed_documents(chunks)

        should_close = False
        if db is None:
            db = async_session_maker()
            should_close = True

        try:
            # Build all chunk records first, then bulk insert
            chunk_records = []
            for i, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings)):
                chunk_info = chunk_dates[i] if i < len(chunk_dates) else {}
                chunk_date_str = chunk_info.get("chunk_date")
                chunk_date = None
                if chunk_date_str:
                    try:
                        chunk_date = datetime.fromisoformat(chunk_date_str)
                    except (ValueError, TypeError):
                        pass

                is_timeless = chunk_info.get("is_timeless", extraction.is_timeless)

                chunk_records.append(DocumentChunk(
                    document_id=document_id,
                    filename=filename,
                    chunk_index=i,
                    text=chunk,
                    embedding=embedding,
                    chunk_date=chunk_date,
                    is_timeless=is_timeless,
                    document_type=extraction.document_type.value,
                    companies=extraction.companies or [],
                    people=extraction.people or [],
                ))

            db.add_all(chunk_records)
            await db.flush()
            if should_close:
                await db.commit()

            return len(chunks)
        finally:
            if should_close:
                await db.close()

    async def search(
        self,
        query: str,
        top_k: int = None,
        document_ids: list[int] = None,
        date_start: datetime = None,
        date_end: datetime = None,
        prioritize_recent: bool = False,
        companies: list[str] = None,
        include_timeless: bool = True,
        db: AsyncSession = None,
    ) -> list[dict]:
        """Search the knowledge base with optional time-aware filtering."""
        if top_k is None:
            top_k = self.settings.top_k_results

        query_embedding = await self.embeddings.aembed_query(query)
        fetch_limit = top_k * 2 if prioritize_recent else top_k

        should_close = False
        if db is None:
            db = async_session_maker()
            should_close = True

        try:
            # pgvector cosine_distance: smaller = more similar
            # Convert to similarity score: 1 - distance
            distance_expr = DocumentChunk.embedding.cosine_distance(query_embedding)

            stmt = select(
                DocumentChunk,
                (1 - distance_expr).label('score')
            )

            # Build filter conditions
            conditions = []

            if document_ids:
                conditions.append(DocumentChunk.document_id.in_(document_ids))

            if companies:
                # Match any of the specified companies using array overlap
                conditions.append(DocumentChunk.companies.overlap(companies))

            if conditions:
                stmt = stmt.where(and_(*conditions))

            # Order by distance (ascending = most similar first)
            stmt = stmt.order_by(distance_expr).limit(fetch_limit)

            result = await db.execute(stmt)
            rows = result.all()

            # Format results
            formatted_results = []
            for chunk, score in rows:
                result_dict = {
                    "document_id": chunk.document_id,
                    "filename": chunk.filename,
                    "chunk_index": chunk.chunk_index,
                    "text": chunk.text,
                    "score": float(score),
                    "chunk_date": chunk.chunk_date.isoformat() if chunk.chunk_date else None,
                    "is_timeless": chunk.is_timeless,
                    "document_type": chunk.document_type,
                    "companies": chunk.companies or [],
                }

                # Apply date filtering in post-processing
                chunk_date = chunk.chunk_date
                if chunk_date:
                    if date_start and chunk_date < date_start:
                        continue
                    if date_end and chunk_date > date_end:
                        continue
                elif not include_timeless and not result_dict["is_timeless"]:
                    if date_start or date_end:
                        continue

                formatted_results.append(result_dict)

            # Re-rank with recency boost if requested
            if prioritize_recent:
                formatted_results = self._rerank_with_recency(formatted_results)

            return formatted_results[:top_k]
        finally:
            if should_close:
                await db.close()

    def _rerank_with_recency(self, results: list[dict]) -> list[dict]:
        """Boost scores for more recent content."""
        now = datetime.now()

        for result in results:
            if result.get("is_timeless"):
                continue

            chunk_date_str = result.get("chunk_date")
            if chunk_date_str:
                try:
                    date = datetime.fromisoformat(chunk_date_str)
                    days_ago = (now - date).days

                    if days_ago < 30:
                        boost = 0.2 * (1 - days_ago / 30)
                    elif days_ago > 365:
                        boost = -0.1 * min(days_ago / 365, 1)
                    else:
                        boost = 0

                    result["score"] = result["score"] * (1 + boost)
                except (ValueError, TypeError):
                    pass

        return sorted(results, key=lambda x: x["score"], reverse=True)

    async def delete_document(self, document_id: int, db: AsyncSession = None) -> bool:
        """Delete all chunks for a document from the knowledge base."""
        should_close = False
        if db is None:
            db = async_session_maker()
            should_close = True

        try:
            stmt = delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
            await db.execute(stmt)

            if should_close:
                await db.commit()

            return True
        finally:
            if should_close:
                await db.close()

    async def get_document_count(self, db: AsyncSession = None) -> int:
        """Get the total number of chunks in the knowledge base."""
        should_close = False
        if db is None:
            db = async_session_maker()
            should_close = True

        try:
            stmt = select(func.count()).select_from(DocumentChunk)
            result = await db.execute(stmt)
            return result.scalar() or 0
        finally:
            if should_close:
                await db.close()


# Singleton instance
_kb_service: Optional[KnowledgeBaseService] = None


def get_knowledge_base_service() -> KnowledgeBaseService:
    """Get the knowledge base service singleton."""
    global _kb_service
    if _kb_service is None:
        _kb_service = KnowledgeBaseService()
    return _kb_service
