"""Document intelligence service for LLM-powered metadata extraction."""

from datetime import datetime
from typing import Optional
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

from backend.config import get_settings
from backend.models.schemas import DocumentExtraction, DocumentType, ExtractedEvent


EXTRACTION_SYSTEM_PROMPT = """You are a document analysis assistant. Your task is to extract structured metadata from documents.

Analyze the document carefully and extract:
1. A descriptive name for the document (e.g., "Acme Corp Q4 Meeting Notes - Jan 2026")
2. A 2-3 sentence summary
3. The document type (email_thread, meeting_notes, client_profile, report, contract, proposal, notes, other)
4. Whether the content is mostly timeless (company profiles, contact info) or dated (meetings, emails)
5. Key dates mentioned in the document
6. Company and people names mentioned
7. Timeline events with specific dates

Be precise with dates. Today's date is {current_date}.

For document types:
- email_thread: Email conversations with multiple messages
- meeting_notes: Notes from meetings, discussions, reviews
- client_profile: Company/client information, contacts, rate cards
- report: Status reports, analysis documents
- contract: Legal agreements, SOWs
- proposal: Business proposals, quotes
- notes: General notes, documentation
- other: Anything that doesn't fit above

For dates:
- Use ISO format (YYYY-MM-DD)
- If a document says "January 15th" without a year, assume the most recent occurrence based on today's date
- If dates should be present (it's dated content) but you cannot determine them, set date_uncertain to true
- Timeless content (profiles, static info) should have is_timeless=true and no primary_date

For events:
- Extract each distinct event with a date
- For email threads: each email is an event
- For meeting notes: the meeting itself plus any action items with due dates
- Event types: meeting, email, deadline, milestone, action_item"""


EXTRACTION_USER_PROMPT = """Analyze this document and extract structured metadata:

<document>
{document_text}
</document>

Extract the metadata following the schema provided. Be thorough with timeline events - capture all dated events mentioned."""


class DocumentIntelligenceService:
    """Service for LLM-powered document analysis and metadata extraction."""

    def __init__(self):
        self.settings = get_settings()
        self._llm: Optional[ChatAnthropic] = None

    @property
    def llm(self) -> ChatAnthropic:
        """Get or create the LLM instance with structured output."""
        if self._llm is None:
            self._llm = ChatAnthropic(
                model=self.settings.claude_model,
                anthropic_api_key=self.settings.anthropic_api_key,
                max_tokens=4096,
            )
        return self._llm

    async def extract_document_metadata(self, text: str) -> DocumentExtraction:
        """Extract structured metadata from document text using Claude."""
        # Truncate very long documents to fit context
        max_chars = 15000
        truncated_text = text[:max_chars]
        if len(text) > max_chars:
            truncated_text += "\n\n[Document truncated for processing...]"

        current_date = datetime.now().strftime("%Y-%m-%d")

        # Use structured output with LangChain
        structured_llm = self.llm.with_structured_output(DocumentExtraction)

        messages = [
            SystemMessage(content=EXTRACTION_SYSTEM_PROMPT.format(current_date=current_date)),
            HumanMessage(content=EXTRACTION_USER_PROMPT.format(document_text=truncated_text)),
        ]

        try:
            result = await structured_llm.ainvoke(messages)
            return result
        except Exception as e:
            # Fallback to basic extraction on error
            return self._fallback_extraction(text, str(e))

    def _fallback_extraction(self, text: str, error: str) -> DocumentExtraction:
        """Provide basic extraction when LLM fails."""
        # Extract a simple title from first line
        lines = text.strip().split("\n")
        first_line = lines[0] if lines else "Untitled Document"
        suggested_name = first_line[:100].strip("#").strip()
        if not suggested_name:
            suggested_name = "Untitled Document"

        return DocumentExtraction(
            suggested_name=suggested_name,
            summary=f"Document processing encountered an error: {error[:200]}",
            document_type=DocumentType.OTHER,
            is_timeless=False,
            primary_date=None,
            date_range_start=None,
            date_range_end=None,
            date_uncertain=True,
            companies=[],
            people=[],
            events=[],
        )

    def assign_chunk_dates(
        self,
        chunks: list[str],
        doc_extraction: DocumentExtraction,
    ) -> list[dict]:
        """Assign date metadata to each chunk based on document extraction.

        Returns list of dicts with:
        - chunk_index: int
        - chunk_date: Optional[str] (ISO date)
        - is_timeless: bool
        """
        results = []

        for i, chunk in enumerate(chunks):
            chunk_info = {
                "chunk_index": i,
                "chunk_date": doc_extraction.primary_date,
                "is_timeless": doc_extraction.is_timeless,
            }

            # For email threads, try to find specific dates in the chunk
            if doc_extraction.document_type == DocumentType.EMAIL_THREAD:
                # Check if any event date matches content in this chunk
                for event in doc_extraction.events:
                    # Simple heuristic: if event title/description appears in chunk
                    if event.title.lower() in chunk.lower():
                        chunk_info["chunk_date"] = event.date
                        break

            # For meeting notes with multiple dates
            elif doc_extraction.document_type == DocumentType.MEETING_NOTES:
                for event in doc_extraction.events:
                    if event.title.lower() in chunk.lower():
                        chunk_info["chunk_date"] = event.date
                        break

            results.append(chunk_info)

        return results


# Singleton
_document_intelligence_service: Optional[DocumentIntelligenceService] = None


def get_document_intelligence_service() -> DocumentIntelligenceService:
    """Get the document intelligence service singleton."""
    global _document_intelligence_service
    if _document_intelligence_service is None:
        _document_intelligence_service = DocumentIntelligenceService()
    return _document_intelligence_service
