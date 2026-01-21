"""Knowledge base service for vector storage and retrieval."""

import uuid
from datetime import datetime
from typing import Optional

from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue, MatchAny, Range

from backend.config import get_settings
from backend.utils.text_processing import chunk_text
from backend.models.schemas import DocumentExtraction


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
    """Service for managing the vector knowledge base."""

    def __init__(self):
        self.settings = get_settings()
        self._client: Optional[QdrantClient] = None
        self._embeddings: Optional[LocalEmbeddings] = None

    @property
    def client(self) -> QdrantClient:
        """Get or create Qdrant client."""
        if self._client is None:
            self._client = QdrantClient(
                path="./data/qdrant_storage"  # Local file-based storage
            )
            self._ensure_collection()
        return self._client

    @property
    def embeddings(self) -> LocalEmbeddings:
        """Get or create embeddings model."""
        if self._embeddings is None:
            self._embeddings = LocalEmbeddings(
                model=self.settings.embedding_model,
            )
        return self._embeddings

    def _ensure_collection(self):
        """Ensure the collection exists in Qdrant."""
        collections = self.client.get_collections().collections
        collection_names = [c.name for c in collections]

        if self.settings.qdrant_collection_name not in collection_names:
            self.client.create_collection(
                collection_name=self.settings.qdrant_collection_name,
                vectors_config=VectorParams(
                    size=self.settings.embedding_dimensions,
                    distance=Distance.COSINE,
                ),
            )

    async def index_document(
        self, document_id: int, filename: str, text: str
    ) -> int:
        """Index a document into the knowledge base (basic version)."""
        # Chunk the text
        chunks = chunk_text(text)

        if not chunks:
            return 0

        # Generate embeddings for all chunks
        chunk_embeddings = await self.embeddings.aembed_documents(chunks)

        # Create points for Qdrant
        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings)):
            point_id = str(uuid.uuid4())
            points.append(
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={
                        "document_id": document_id,
                        "filename": filename,
                        "chunk_index": i,
                        "text": chunk,
                    },
                )
            )

        # Upsert points to Qdrant
        self.client.upsert(
            collection_name=self.settings.qdrant_collection_name,
            points=points,
        )

        return len(chunks)

    async def index_document_with_metadata(
        self,
        document_id: int,
        filename: str,
        text: str,
        extraction: DocumentExtraction,
    ) -> int:
        """Index a document with time-aware metadata."""
        from backend.services.document_intelligence import get_document_intelligence_service

        # Chunk the text
        chunks = chunk_text(text)

        if not chunks:
            return 0

        # Get chunk-level date assignments
        intelligence = get_document_intelligence_service()
        chunk_dates = intelligence.assign_chunk_dates(chunks, extraction)

        # Generate embeddings for all chunks
        chunk_embeddings = await self.embeddings.aembed_documents(chunks)

        # Create points for Qdrant with enhanced payload
        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings)):
            point_id = str(uuid.uuid4())

            # Get date info for this chunk
            chunk_info = chunk_dates[i] if i < len(chunk_dates) else {}
            chunk_date = chunk_info.get("chunk_date")
            is_timeless = chunk_info.get("is_timeless", extraction.is_timeless)

            points.append(
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={
                        "document_id": document_id,
                        "filename": filename,
                        "chunk_index": i,
                        "text": chunk,
                        # Time-aware fields
                        "chunk_date": chunk_date,
                        "is_timeless": is_timeless,
                        "document_type": extraction.document_type.value,
                        "companies": extraction.companies,
                        "people": extraction.people,
                    },
                )
            )

        # Upsert points to Qdrant
        self.client.upsert(
            collection_name=self.settings.qdrant_collection_name,
            points=points,
        )

        return len(chunks)

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
    ) -> list[dict]:
        """Search the knowledge base with optional time-aware filtering."""
        if top_k is None:
            top_k = self.settings.top_k_results

        # Generate embedding for the query
        query_embedding = await self.embeddings.aembed_query(query)

        # Build filter conditions
        must_conditions = []

        if document_ids:
            must_conditions.append(
                FieldCondition(key="document_id", match=MatchAny(any=document_ids))
            )

        if companies:
            # Match any of the specified companies
            for company in companies:
                must_conditions.append(
                    FieldCondition(key="companies", match=MatchAny(any=[company]))
                )

        # Build filter
        filter_condition = None
        if must_conditions:
            filter_condition = Filter(must=must_conditions)

        # Fetch more results if we'll be re-ranking
        fetch_limit = top_k * 2 if prioritize_recent else top_k

        # Search in Qdrant
        results = self.client.query_points(
            collection_name=self.settings.qdrant_collection_name,
            query=query_embedding,
            limit=fetch_limit,
            query_filter=filter_condition,
        )

        # Format results
        formatted_results = []
        for hit in results.points:
            result = {
                "document_id": hit.payload["document_id"],
                "filename": hit.payload["filename"],
                "chunk_index": hit.payload["chunk_index"],
                "text": hit.payload["text"],
                "score": hit.score,
                "chunk_date": hit.payload.get("chunk_date"),
                "is_timeless": hit.payload.get("is_timeless", False),
                "document_type": hit.payload.get("document_type"),
                "companies": hit.payload.get("companies", []),
            }

            # Apply date filtering in post-processing (more flexible)
            chunk_date = result["chunk_date"]
            if chunk_date:
                try:
                    chunk_datetime = datetime.fromisoformat(chunk_date)
                    if date_start and chunk_datetime < date_start:
                        continue
                    if date_end and chunk_datetime > date_end:
                        continue
                except (ValueError, TypeError):
                    pass
            elif not include_timeless and not result["is_timeless"]:
                # Skip undated non-timeless content if filtering by date
                if date_start or date_end:
                    continue

            formatted_results.append(result)

        # Re-rank with recency boost if requested
        if prioritize_recent:
            formatted_results = self._rerank_with_recency(formatted_results)

        return formatted_results[:top_k]

    def _rerank_with_recency(self, results: list[dict]) -> list[dict]:
        """Boost scores for more recent content."""
        now = datetime.now()

        for result in results:
            if result.get("is_timeless"):
                # Timeless content gets no boost but no penalty
                continue

            chunk_date = result.get("chunk_date")
            if chunk_date:
                try:
                    date = datetime.fromisoformat(chunk_date)
                    days_ago = (now - date).days

                    # Recency boost: recent content (< 30 days) gets up to 20% boost
                    # Older content (> 365 days) gets slight penalty
                    if days_ago < 30:
                        boost = 0.2 * (1 - days_ago / 30)
                    elif days_ago > 365:
                        boost = -0.1 * min(days_ago / 365, 1)
                    else:
                        boost = 0

                    result["score"] = result["score"] * (1 + boost)
                except (ValueError, TypeError):
                    pass

        # Re-sort by adjusted score
        return sorted(results, key=lambda x: x["score"], reverse=True)

    def delete_document(self, document_id: int) -> bool:
        """Delete all chunks for a document from the knowledge base."""
        self.client.delete(
            collection_name=self.settings.qdrant_collection_name,
            points_selector={
                "filter": {
                    "must": [
                        {
                            "key": "document_id",
                            "match": {"value": document_id},
                        }
                    ]
                }
            },
        )
        return True

    def get_document_count(self) -> int:
        """Get the total number of unique documents in the knowledge base."""
        try:
            collection_info = self.client.get_collection(self.settings.qdrant_collection_name)
            return collection_info.points_count
        except Exception:
            return 0


# Singleton instance
_kb_service: Optional[KnowledgeBaseService] = None


def get_knowledge_base_service() -> KnowledgeBaseService:
    """Get the knowledge base service singleton."""
    global _kb_service
    if _kb_service is None:
        _kb_service = KnowledgeBaseService()
    return _kb_service
