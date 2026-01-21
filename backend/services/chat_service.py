"""Chat service combining RAG retrieval with LLM responses."""

import re
from datetime import datetime
from typing import Optional

from backend.services.knowledge_base import get_knowledge_base_service
from backend.services.llm_service import get_llm_service


class ChatService:
    """Service for handling chat interactions with RAG."""

    MONTHS = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
    ]

    RECENCY_KEYWORDS = ["recent", "latest", "last", "newest", "current", "today", "this week", "this month"]

    def __init__(self):
        self.kb = get_knowledge_base_service()
        self.llm = get_llm_service()

    def _detect_time_hints(self, message: str) -> dict:
        """Detect time-related hints in the user's query."""
        hints = {}
        message_lower = message.lower()

        # Check for recency keywords
        if any(keyword in message_lower for keyword in self.RECENCY_KEYWORDS):
            hints["prioritize_recent"] = True

        # Check for month references
        for i, month in enumerate(self.MONTHS):
            if month in message_lower:
                # Assume current year if not specified
                year = datetime.now().year
                hints["date_start"] = datetime(year, i + 1, 1)
                # Set end date to start of next month
                if i + 1 == 12:
                    hints["date_end"] = datetime(year + 1, 1, 1)
                else:
                    hints["date_end"] = datetime(year, i + 2, 1)
                break

        # Check for year references (e.g., "in 2025", "2026")
        year_match = re.search(r'\b(20\d{2})\b', message)
        if year_match:
            year = int(year_match.group(1))
            if "date_start" not in hints:
                hints["date_start"] = datetime(year, 1, 1)
                hints["date_end"] = datetime(year + 1, 1, 1)

        # Check for quarter references (e.g., "Q4 2025", "Q1")
        quarter_match = re.search(r'Q([1-4])\s*(20\d{2})?', message, re.IGNORECASE)
        if quarter_match:
            quarter = int(quarter_match.group(1))
            year = int(quarter_match.group(2)) if quarter_match.group(2) else datetime.now().year
            start_month = (quarter - 1) * 3 + 1
            hints["date_start"] = datetime(year, start_month, 1)
            end_month = start_month + 3
            if end_month > 12:
                hints["date_end"] = datetime(year + 1, 1, 1)
            else:
                hints["date_end"] = datetime(year, end_month, 1)

        return hints

    def _extract_company_hints(self, message: str) -> list[str]:
        """Extract potential company names from the query."""
        # Simple pattern matching for common company name patterns
        # This could be enhanced with NER in the future
        companies = []

        # Look for "about X", "at X", "with X", "for X" patterns
        patterns = [
            r'\babout\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)',
            r'\bat\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)',
            r'\bwith\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)',
            r'\bfor\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)',
        ]

        for pattern in patterns:
            matches = re.findall(pattern, message)
            companies.extend(matches)

        return list(set(companies))

    async def chat(
        self,
        message: str,
        use_knowledge_base: bool = True,
        history: list[dict] = None,
    ) -> dict:
        """Process a chat message with optional time-aware RAG."""
        sources = []
        context = None

        # Search knowledge base if enabled
        if use_knowledge_base:
            # Detect time hints in the query
            time_hints = self._detect_time_hints(message)
            company_hints = self._extract_company_hints(message)

            # Build search parameters
            search_params = {"query": message}

            if time_hints.get("date_start"):
                search_params["date_start"] = time_hints["date_start"]
            if time_hints.get("date_end"):
                search_params["date_end"] = time_hints["date_end"]
            if time_hints.get("prioritize_recent"):
                search_params["prioritize_recent"] = True
            if company_hints:
                search_params["companies"] = company_hints

            results = await self.kb.search(**search_params)

            if results:
                # Build context from search results with date info
                context_parts = []
                for r in results:
                    date_info = ""
                    if r.get("chunk_date"):
                        date_info = f" (Date: {r['chunk_date']})"
                    elif r.get("is_timeless"):
                        date_info = " (Timeless info)"

                    context_parts.append(f"[From: {r['filename']}{date_info}]\n{r['text']}")
                    sources.append({
                        "document_id": r["document_id"],
                        "filename": r["filename"],
                        "snippet": r["text"][:200] + "..." if len(r["text"]) > 200 else r["text"],
                        "relevance_score": r["score"],
                        "date": r.get("chunk_date"),
                    })
                context = "\n\n---\n\n".join(context_parts)

        # Get LLM response
        response = await self.llm.chat(
            message=message,
            context=context,
            history=history,
        )

        return {
            "message": response,
            "sources": sources,
        }


# Singleton
_chat_service: Optional[ChatService] = None


def get_chat_service() -> ChatService:
    """Get the chat service singleton."""
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service
