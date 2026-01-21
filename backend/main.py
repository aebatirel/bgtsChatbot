"""Main FastAPI application entry point."""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import get_settings
from backend.models.database import init_db
from backend.models.schemas import HealthResponse
from backend.routers import chat, documents, timeline


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown tasks."""
    # Startup
    settings = get_settings()

    # Create upload directory if it doesn't exist
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs("./data/qdrant_storage", exist_ok=True)

    # Initialize database
    await init_db()

    yield

    # Shutdown (cleanup tasks would go here)


app = FastAPI(
    title="Knowledge Management Chatbot",
    description="A document-centric chatbot with RAG capabilities",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(documents.router, prefix="/api", tags=["Documents"])
app.include_router(timeline.router, prefix="/api", tags=["Timeline"])


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        services={
            "database": "connected",
            "qdrant": "available",
            "claude_model": settings.claude_model,
            "embedding_model": settings.embedding_model,
        },
    )


# Serve static frontend files
app.mount("/static", StaticFiles(directory="frontend"), name="static")


@app.get("/")
async def serve_frontend():
    """Serve the main chat page."""
    return FileResponse("frontend/index.html")


@app.get("/documents")
async def serve_documents_page():
    """Serve the documents management page."""
    return FileResponse("frontend/documents.html")


@app.get("/timeline")
async def serve_timeline_page():
    """Serve the timeline page."""
    return FileResponse("frontend/timeline.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
