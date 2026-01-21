"""Text processing utilities for document handling and RAG."""

import re
from langchain_text_splitters import RecursiveCharacterTextSplitter

from backend.config import get_settings


def clean_text(text: str) -> str:
    """Clean and normalize text content."""
    # Remove excessive whitespace
    text = re.sub(r"\s+", " ", text)

    # Remove control characters except newlines
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Remove excessive newlines (more than 2 consecutive)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def generate_preview(text: str, max_length: int = 500) -> str:
    """Generate a preview of the document content."""
    cleaned = clean_text(text)

    if len(cleaned) <= max_length:
        return cleaned

    # Try to cut at a sentence boundary
    preview = cleaned[:max_length]
    last_period = preview.rfind(".")
    last_newline = preview.rfind("\n")

    cut_point = max(last_period, last_newline)
    if cut_point > max_length // 2:
        preview = preview[: cut_point + 1]
    else:
        # Cut at word boundary
        last_space = preview.rfind(" ")
        if last_space > max_length // 2:
            preview = preview[:last_space]

    return preview.strip() + "..."


def chunk_text(text: str, chunk_size: int = None, chunk_overlap: int = None) -> list[str]:
    """Split text into chunks for embedding and retrieval."""
    settings = get_settings()

    if chunk_size is None:
        chunk_size = settings.chunk_size
    if chunk_overlap is None:
        chunk_overlap = settings.chunk_overlap

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = text_splitter.split_text(text)
    return [clean_text(chunk) for chunk in chunks if chunk.strip()]
