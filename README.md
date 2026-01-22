# Knowledge Management Chatbot

A document-centric knowledge management chatbot with RAG (Retrieval-Augmented Generation) capabilities. Upload documents, save them to a persistent knowledge base, and chat with your documents using natural language.

## Quick Start

```bash
# 1. Clone and setup
cd chatbot1
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Configure API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Start the backend
uvicorn backend.main:app --reload

# 4. Start the frontend (new terminal)
cd frontend-react
npm install
npm run dev
```

Open http://localhost:5173 and start chatting!

---

## Features

### Core Features
- **Chat Interface**: Conversational AI powered by Claude Sonnet 4.5
- **Document Upload**: Support for PDF, DOCX, TXT, and MD files
- **Knowledge Base**: Persistent vector storage with Qdrant
- **RAG Pipeline**: Semantic search + LLM for accurate, sourced answers
- **Document Preview**: See document contents before saving to KB
- **Source Citations**: Responses include clickable references to source documents

### Document Intelligence (LLM-Powered)
- **Auto-Naming**: Documents automatically named based on content analysis
- **Smart Summarization**: AI-generated summaries for each document
- **Metadata Extraction**: Extracts companies, people, dates, and document type
- **Timeline Events**: Automatically extracts meetings, emails, deadlines from documents
- **Timeless Detection**: Identifies static content (profiles, contacts) vs dated content (meetings, reports)
- **Date Uncertainty**: Prompts user for date if document appears time-sensitive but date is unclear

### Time-Aware RAG
- **Temporal Chunking**: Each chunk stores date metadata for time-aware retrieval
- **Recency Boost**: Recent documents prioritized when queries mention time ("latest", "recent", "Q4")
- **Date Range Filtering**: Search within specific date ranges
- **Company Filtering**: Filter search results by mentioned companies

### Multi-Page Application
- **Chat Page** (`/`): Main conversational interface with document upload
- **Documents Page** (`/documents`): Browse, search, filter, download, and delete documents
- **Timeline Page** (`/timeline`): Visual timeline of extracted events with company/date filters
- **Linked References**: Click any source citation to view the full document details

---

## Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) | Async, high performance, excellent for RAG apps |
| **LLM** | [Claude Sonnet 4.5](https://docs.anthropic.com/) | Best balance of capability/speed/cost |
| **Embeddings** | [Sentence Transformers](https://www.sbert.net/) | Local, free, no API limits |
| **Vector Database** | [Qdrant](https://qdrant.tech/) | Open-source, high performance, local storage |
| **RAG Framework** | [LangChain](https://docs.langchain.com/) | Flexible, well-documented |
| **Database** | SQLite + SQLAlchemy | Simple, file-based, async support |
| **Document Parsing** | pypdfium2, python-docx | Fast PDF/DOCX extraction (commercial-friendly) |
| **Frontend** | React + Tailwind CSS | Modern liquid glass design with Motion.js animations |

### Key Decisions

- **Local embeddings over cloud APIs**: Uses `all-MiniLM-L6-v2` via sentence-transformers - free, fast, no rate limits
- **Qdrant local mode**: No Docker required, stores data in `./data/qdrant_storage`
- **No authentication for MVP**: Single user, can add OAuth/JWT later
- **React frontend with liquid glass design**: Modern glassmorphism UI with Tailwind CSS v4 and Motion.js animations

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (HTML/JS)                       │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   Chat Window   │  │  File Upload    │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
└───────────┼─────────────────────┼───────────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                            │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Chat Endpoint  │  │ Upload Endpoint │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌─────────────────────────────────────────┐                │
│  │         Document Processor               │                │
│  │  - Parse PDF/DOCX/TXT                   │                │
│  │  - Extract text & metadata              │                │
│  │  - Generate preview                     │                │
│  └─────────────────┬───────────────────────┘                │
│                    │                                         │
│                    ▼                                         │
│  ┌─────────────────────────────────────────┐                │
│  │         Knowledge Base Service           │                │
│  │  - Chunk documents                       │                │
│  │  - Generate embeddings (local)           │                │
│  │  - Store in Qdrant                       │                │
│  └─────────────────┬───────────────────────┘                │
│                    │                                         │
│                    ▼                                         │
│  ┌─────────────────────────────────────────┐                │
│  │         RAG Query Engine                 │                │
│  │  - Semantic search                       │                │
│  │  - Context retrieval                     │                │
│  │  - Claude API for answers               │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
            │                     │
            ▼                     ▼
┌───────────────────┐   ┌───────────────────┐
│   Qdrant Vector   │   │  SQLite Database  │
│     Database      │   │  (metadata)       │
└───────────────────┘   └───────────────────┘
```

### Component Details

| Component | File | Responsibility |
|-----------|------|----------------|
| **FastAPI App** | `backend/main.py` | HTTP server, CORS, routing, lifespan |
| **Config** | `backend/config.py` | Environment variables, settings |
| **Chat Router** | `backend/routers/chat.py` | `/api/chat` endpoint |
| **Documents Router** | `backend/routers/documents.py` | Upload, save, list, download, delete |
| **Timeline Router** | `backend/routers/timeline.py` | Timeline events API with filters |
| **Document Processor** | `backend/services/document_processor.py` | Parse PDF/DOCX/TXT |
| **Document Intelligence** | `backend/services/document_intelligence.py` | LLM metadata extraction (Claude) |
| **Knowledge Base** | `backend/services/knowledge_base.py` | Qdrant + local embeddings + time-aware search |
| **Chat Service** | `backend/services/chat_service.py` | RAG orchestration + time-hint detection |
| **LLM Service** | `backend/services/llm_service.py` | Claude API wrapper |
| **Text Processing** | `backend/utils/text_processing.py` | Chunking, cleaning |

---

## Data Flow Diagrams

### Document Upload Flow

```
User selects file
        │
        ▼
┌───────────────────┐
│  POST /api/upload │
└─────────┬─────────┘
          │
          ▼
┌───────────────────────────────┐
│   DocumentProcessor           │
│   - Validate file type        │
│   - Extract text (PyMuPDF/    │
│     python-docx)              │
│   - Generate preview (500ch)  │
│   - Store in temp memory      │
│   - Return upload_id          │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│   Response to Frontend        │
│   {                           │
│     upload_id: "uuid",        │
│     filename: "doc.pdf",      │
│     preview: "First 500ch..", │
│     message: "Save to KB?"    │
│   }                           │
└───────────────────────────────┘
              │
              ▼
      User clicks "Save"
              │
              ▼
┌───────────────────────────────┐
│  POST /api/documents/save     │
│  { upload_id: "uuid" }        │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│   DocumentIntelligence (LLM)  │
│   - Auto-generate name        │
│   - Create summary            │
│   - Extract dates/companies   │
│   - Identify timeline events  │
│   - Detect if timeless        │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│   KnowledgeBaseService        │
│   1. Chunk text with dates    │
│   2. Generate embeddings      │
│      (sentence-transformers)  │
│   3. Store vectors in Qdrant  │
│      with time metadata       │
│   4. Save to SQLite:          │
│      - Document record        │
│      - DocumentMetadata       │
│      - TimelineEvents         │
└───────────────────────────────┘
```

### Chat/RAG Flow

```
User sends message
        │
        ▼
┌───────────────────┐
│  POST /api/chat   │
│  {                │
│    message: "...",│
│    use_kb: true   │
│  }                │
└─────────┬─────────┘
          │
          ▼
┌───────────────────────────────┐
│   ChatService                 │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│   1. RETRIEVE                 │
│   KnowledgeBaseService.search │
│   - Embed query (local)       │
│   - Search Qdrant (top 5)     │
│   - Return relevant chunks    │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│   2. AUGMENT                  │
│   Build prompt with context:  │
│   "Use this context:          │
│    [chunk1] [chunk2]..."      │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│   3. GENERATE                 │
│   LLMService.chat             │
│   - Send to Claude Sonnet 4.5 │
│   - Get response              │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│   Response                    │
│   {                           │
│     message: "Answer...",     │
│     sources: [                │
│       {filename, snippet,     │
│        relevance_score}       │
│     ]                         │
│   }                           │
└───────────────────────────────┘
```

---

## Database Schema

### SQLite Tables (backend/models/database.py)

#### Documents Table
```sql
CREATE TABLE documents (
    id              INTEGER PRIMARY KEY,
    filename        VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type       VARCHAR(50) NOT NULL,
    file_size       INTEGER NOT NULL,
    content_preview TEXT,
    full_text       TEXT,
    stored_file_path VARCHAR(500),  -- Path to original file for download
    chunk_count     INTEGER DEFAULT 0,
    is_indexed      BOOLEAN DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Document Metadata Table (LLM-Extracted)
```sql
CREATE TABLE document_metadata (
    id              INTEGER PRIMARY KEY,
    document_id     INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    generated_name  VARCHAR(500),      -- LLM-suggested filename
    summary         TEXT,              -- AI-generated summary
    document_type   VARCHAR(50),       -- email_thread, meeting_notes, client_profile, etc.
    is_timeless     BOOLEAN DEFAULT FALSE,  -- Static content vs dated
    primary_date    DATETIME,          -- Main date of the document
    date_range_start DATETIME,         -- For documents spanning a period
    date_range_end  DATETIME,
    date_uncertain  BOOLEAN DEFAULT FALSE,  -- Needs user input
    companies       TEXT,              -- JSON array: ["Acme Corp", "TechStart Inc"]
    people          TEXT,              -- JSON array: ["John Smith", "Jane Doe"]
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Timeline Events Table
```sql
CREATE TABLE timeline_events (
    id              INTEGER PRIMARY KEY,
    document_id     INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    event_date      DATETIME NOT NULL,
    event_type      VARCHAR(50),       -- meeting, email, deadline, milestone, action_item
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    companies       TEXT,              -- JSON array
    people          TEXT,              -- JSON array
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Conversations Table
```sql
CREATE TABLE conversations (
    id          INTEGER PRIMARY KEY,
    title       VARCHAR(255) DEFAULT 'New Conversation',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Messages Table
```sql
CREATE TABLE messages (
    id              INTEGER PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    role            VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
    content         TEXT NOT NULL,
    sources         TEXT,  -- JSON string of source documents
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Qdrant Vector Schema

```
Collection: knowledge_base
├── Vector: 384 dimensions (all-MiniLM-L6-v2)
├── Distance: Cosine similarity
└── Payload:
    ├── document_id: int      # Links to SQLite documents.id
    ├── filename: string      # Document filename
    ├── chunk_index: int      # Position in document
    ├── text: string          # Actual chunk content
    ├── primary_date: string  # ISO date for time-aware search
    ├── is_timeless: bool     # True for static content
    ├── companies: string[]   # Companies mentioned in chunk
    └── document_type: string # Type classification
```

---

## API Data Models (Pydantic Schemas)

### Request Models

```python
# Chat Request
class ChatRequest:
    message: str                    # User's message
    conversation_id: int | None     # Continue existing conversation
    use_knowledge_base: bool = True # Toggle RAG search

# Document Save Request
class DocumentSaveRequest:
    upload_id: str                  # From upload response
    custom_name: str | None         # Optional rename
```

### Response Models

```python
# Chat Response
class ChatResponse:
    message: str                    # Assistant's response
    conversation_id: int            # For follow-up messages
    sources: list[SourceDocument]   # Cited documents

class SourceDocument:
    document_id: int
    filename: str
    snippet: str                    # Relevant excerpt
    relevance_score: float          # 0.0 - 1.0

# Document Upload Response
class DocumentUploadResponse:
    upload_id: str                  # Use this to save
    filename: str
    file_type: str                  # MIME type
    file_size: int                  # Bytes
    preview: str                    # First 500 chars
    full_text_length: int
    message: str                    # "Save to KB?"

# Document Response
class DocumentResponse:
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    content_preview: str | None
    chunk_count: int
    is_indexed: bool
    created_at: datetime
    updated_at: datetime
```

---

## Project Structure

```
chatbot1/
├── backend/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Settings from .env
│   ├── models/
│   │   ├── __init__.py
│   │   ├── schemas.py          # Pydantic request/response models
│   │   └── database.py         # SQLAlchemy ORM models (Document, DocumentMetadata, TimelineEvent)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── document_processor.py   # PDF/DOCX/TXT parsing
│   │   ├── document_intelligence.py # LLM metadata extraction (Claude)
│   │   ├── knowledge_base.py       # Qdrant + embeddings + time-aware search
│   │   ├── chat_service.py         # RAG orchestration + time-hint detection
│   │   └── llm_service.py          # Claude API wrapper
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── chat.py             # POST /api/chat
│   │   ├── documents.py        # Document CRUD + download endpoints
│   │   └── timeline.py         # Timeline events API
│   └── utils/
│       ├── __init__.py
│       └── text_processing.py  # Chunking, text cleaning
├── frontend/                   # Legacy vanilla HTML/CSS/JS (deprecated)
│   ├── index.html
│   ├── documents.html
│   ├── timeline.html
│   ├── styles.css
│   ├── app.js
│   ├── documents.js
│   └── timeline.js
├── frontend-react/             # NEW: React + Tailwind Liquid Glass UI
│   ├── src/
│   │   ├── main.tsx            # App entry point
│   │   ├── App.tsx             # Router + providers
│   │   ├── index.css           # Tailwind + glass utilities
│   │   ├── components/
│   │   │   ├── ui/             # Glass primitives (GlassCard, GlassButton, etc.)
│   │   │   ├── layout/         # AppShell, Header, GradientBackground
│   │   │   ├── chat/           # Chat components
│   │   │   ├── documents/      # Document components
│   │   │   └── timeline/       # Timeline components
│   │   ├── pages/              # ChatPage, DocumentsPage, TimelinePage
│   │   ├── api/                # API client (axios)
│   │   ├── hooks/              # React hooks
│   │   ├── types/              # TypeScript types
│   │   └── lib/                # Utilities (cn, formatters, constants)
│   ├── vite.config.ts          # Vite + Tailwind + API proxy
│   └── package.json
├── data/
│   ├── uploads/                # Stored original files for download
│   ├── qdrant_storage/         # Qdrant local persistence
│   └── chatbot.db              # SQLite database
├── venv/                       # Python virtual environment
├── requirements.txt            # Python dependencies
├── .env                        # API keys (gitignored)
├── .env.example                # Template for .env
└── README.md                   # This file
```

---

## API Endpoints

### Core Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/health` | Health check | - | `{status, version, services}` |
| `POST` | `/api/chat` | Send message | `ChatRequest` | `ChatResponse` |
| `POST` | `/api/upload` | Upload for preview | `multipart/form-data` | `DocumentUploadResponse` |
| `POST` | `/api/documents/save` | Save to KB with LLM processing | `DocumentSaveRequest` | `DocumentResponse` |
| `GET` | `/api/documents` | List all docs with metadata | - | `DocumentListResponse` |
| `GET` | `/api/documents/{id}` | Get doc details | - | `DocumentResponse` |
| `GET` | `/api/documents/{id}/download` | Download original file | - | File download |
| `DELETE` | `/api/documents/{id}` | Delete from KB | - | `{message}` |

### Timeline Endpoints

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/timeline` | Get timeline events | `company`, `person`, `start_date`, `end_date`, `event_type`, `limit`, `offset` | `TimelineResponse` |
| `GET` | `/api/timeline/companies` | List all companies | - | `CompaniesListResponse` |
| `GET` | `/api/timeline/event-types` | List all event types | - | `{event_types: string[]}` |

### Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Chat | Main conversational interface with upload |
| `/documents` | Documents | Browse, filter, download, delete documents |
| `/timeline` | Timeline | Visual event timeline with filters |

### Example API Calls

```bash
# Health check
curl http://localhost:8000/api/health

# Chat (without KB)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "use_knowledge_base": false}'

# Chat (with KB search)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What do my documents say about X?", "use_knowledge_base": true}'

# Upload document
curl -X POST http://localhost:8000/api/upload \
  -F "file=@document.pdf"

# Save to knowledge base
curl -X POST http://localhost:8000/api/documents/save \
  -H "Content-Type: application/json" \
  -d '{"upload_id": "abc-123-uuid"}'

# List documents
curl http://localhost:8000/api/documents

# Delete document
curl -X DELETE http://localhost:8000/api/documents/1
```

---

## Document Intelligence (LLM Extraction)

When a document is saved, it passes through the Document Intelligence service which uses Claude to extract structured metadata:

### Extraction Process

```
Document Text
     │
     ▼
┌─────────────────────────────────┐
│  Claude API (Structured Output) │
│  - Analyzes full document text  │
│  - Uses tool_use for JSON       │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  Extracted Metadata             │
│  - suggested_name: string       │
│  - summary: string (2-3 sent)   │
│  - document_type: enum          │
│  - is_timeless: boolean         │
│  - primary_date: ISO date       │
│  - companies: string[]          │
│  - people: string[]             │
│  - events: TimelineEvent[]      │
└─────────────────────────────────┘
```

### Document Types

| Type | Description | Example |
|------|-------------|---------|
| `email_thread` | Email conversations | Client correspondence |
| `meeting_notes` | Meeting summaries | Weekly sync notes |
| `client_profile` | Company/contact info | Account overview |
| `report` | Analysis/reports | Quarterly review |
| `contract` | Legal agreements | Service agreement |
| `proposal` | Business proposals | Project proposal |
| `notes` | General notes | Research notes |
| `other` | Unclassified | Misc documents |

### Timeline Event Types

| Type | Icon | Description |
|------|------|-------------|
| `meeting` | 🤝 | Scheduled meetings, calls |
| `email` | 📧 | Important email exchanges |
| `deadline` | ⏰ | Due dates, deliverables |
| `milestone` | 🎯 | Project milestones, achievements |
| `action_item` | ✅ | Tasks, follow-ups |

---

## RAG Pipeline Details

### Text Chunking Strategy

| Parameter | Value | Reason |
|-----------|-------|--------|
| Chunk Size | 1000 chars | Balance between context and precision |
| Chunk Overlap | 200 chars | Preserve context at boundaries |
| Separators | `\n\n`, `\n`, `. `, ` ` | Prefer semantic breaks |

### Embedding Configuration

| Parameter | Value |
|-----------|-------|
| Model | `all-MiniLM-L6-v2` |
| Dimensions | 384 |
| Provider | Sentence Transformers (local) |

### Retrieval Configuration

| Parameter | Value |
|-----------|-------|
| Top K Results | 5 |
| Distance Metric | Cosine Similarity |
| Vector Store | Qdrant (local) |

### Time-Aware Search

The chat service detects temporal hints in queries and adjusts retrieval:

| Hint Type | Examples | Behavior |
|-----------|----------|----------|
| **Months** | "January", "last March" | Filter to that month |
| **Years** | "2024", "last year" | Filter to that year |
| **Quarters** | "Q4", "Q1 2024" | Filter to quarter range |
| **Recency** | "recent", "latest", "newest" | Apply recency boost scoring |
| **Companies** | "Acme", "TechStart" | Filter by company mentions |

**Recency Boost Formula:**
```
final_score = base_score * (1 + recency_boost)
recency_boost = max(0, 1 - (days_old / 365)) * 0.3
```

Documents from the last year get up to 30% score boost, linearly decreasing with age.

---

## React Frontend (Liquid Glass Design)

The new React frontend features a modern **liquid glass/glassmorphism** design with fluid animations.

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Build Tool** | [Vite](https://vite.dev/) |
| **Framework** | React 18 + TypeScript |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Animations** | [Motion.js](https://motion.dev/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Routing** | React Router v7 |
| **Data Fetching** | React Query + Axios |

### Design System

#### Glass Effect Classes
```css
.glass        /* Light glass with backdrop blur */
.glass-heavy  /* Stronger blur for modals */
.glass-card   /* Card with rounded corners */
.glass-modal  /* Full modal styling */
.glass-input  /* Form input styling */
.glass-button /* Interactive button */
```

#### Color Palette
- **Background**: Soft gradient (light blue → purple → pink)
- **Glass surfaces**: Semi-transparent white with blur
- **Primary accent**: Blue-purple (oklch 60% 0.15 250)
- **Text**: Dark blue-gray tones for readability

#### Animation Patterns
- **Spring physics**: Natural, bouncy interactions
- **Staggered lists**: Cards animate in sequence
- **Hover effects**: Subtle scale and shadow changes
- **Page transitions**: Smooth fade and slide

### Component Library

| Component | Description |
|-----------|-------------|
| `GlassCard` | Container with glass effect, optional accent color |
| `GlassButton` | Animated button with variants (primary, secondary, ghost, danger) |
| `GlassModal` | Overlay modal with spring animation |
| `GlassInput` | Form input with focus ring |
| `GlassSelect` | Dropdown with custom styling |
| `GlassBadge` | Colored badge for types |
| `GlassTag` | Small tag for metadata |
| `TypingIndicator` | Animated dots for loading |

### Pages

| Route | Component | Features |
|-------|-----------|----------|
| `/` | `ChatPage` | Message bubbles, KB toggle, file upload modal |
| `/documents` | `DocumentsPage` | Searchable grid, type filters, detail modal |
| `/timeline` | `TimelinePage` | Vertical timeline, company/date filters |

---

## Setup & Installation

### Prerequisites

- Python 3.10+
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com/))

### Installation

```bash
# Clone/navigate to project
cd chatbot1

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure API keys
cp .env.example .env
# Edit .env and add your API keys
```

### Running

#### Option 1: React Frontend (Recommended)

```bash
# Terminal 1: Start backend
source venv/bin/activate
uvicorn backend.main:app --reload
# Backend runs at http://localhost:8000

# Terminal 2: Start React frontend
cd frontend-react
npm install  # First time only
npm run dev
# Frontend runs at http://localhost:5173
```

The React frontend proxies `/api/*` requests to the backend automatically.

#### Option 2: Legacy Vanilla Frontend

```bash
# Start backend (serves vanilla frontend)
source venv/bin/activate
uvicorn backend.main:app --reload

# Open in browser
open http://localhost:8000
```

### Stopping

Press `Ctrl+C` in both terminals, or:
```bash
pkill -f "uvicorn backend.main"
pkill -f "vite"
```

---

## Configuration

All settings in `.env` (loaded via Pydantic Settings):

```env
# API Keys
ANTHROPIC_API_KEY=sk-ant-...      # Required for Claude

# Qdrant Configuration
QDRANT_HOST=localhost              # Not used in local mode
QDRANT_PORT=6333                   # Not used in local mode

# Database
DATABASE_URL=sqlite+aiosqlite:///./data/chatbot.db

# Upload settings
UPLOAD_DIR=./data/uploads
MAX_UPLOAD_SIZE_MB=50

# Model settings
CLAUDE_MODEL=claude-sonnet-4-5-20250929
EMBEDDING_MODEL=all-MiniLM-L6-v2   # Local sentence-transformers model
EMBEDDING_DIMENSIONS=384

# RAG settings
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RESULTS=5
```

---

## Usage Guide

### 1. Chat with the Assistant
Simply type messages in the chat box. The assistant uses Claude Sonnet 4.5. Use the navigation header to switch between pages.

### 2. Upload Documents
Click the 📎 button to upload PDF, DOCX, TXT, or MD files. You'll see a preview before deciding to save.

### 3. Save to Knowledge Base
After uploading, click "Save to Knowledge Base". The document will be:
- **Analyzed by AI**: Auto-named, summarized, and metadata extracted
- **Time-indexed**: Dates and events extracted for time-aware retrieval
- **Chunked & embedded**: Stored in Qdrant for semantic search

The modal will show the AI-generated name, summary, document type, and any extracted companies/people.

### 4. Query Your Documents
With KB toggle ON (📚), your questions will search the knowledge base. The system:
- Detects time hints ("recent", "latest", "Q4 2024") and prioritizes recent documents
- Extracts company mentions to filter relevant results
- Returns clickable source citations linking to document details

### 5. Browse Documents
Navigate to the **Documents** page to:
- View all uploaded documents with summaries and metadata
- Filter by document type or search by content
- Click a document card to view full details
- Download original files or delete documents

### 6. View Timeline
Navigate to the **Timeline** page to:
- See all extracted events in chronological order
- Filter by company, event type, or date range
- Click event sources to view the original document

### 7. Toggle KB Search
Click the 📚 button to toggle knowledge base search on/off. When OFF, it's a direct chat with Claude.

---

## PRD Requirements Status

Based on the original Product Requirements Document:

### Implemented (MVP + Phase 2)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Natural language query interface | ✅ | Claude Sonnet 4.5 |
| Document upload (PDF, DOCX, TXT) | ✅ | PyMuPDF + python-docx |
| Document preview before saving | ✅ | 500 char preview |
| Knowledge base storage | ✅ | Qdrant + SQLite |
| Semantic search with RAG | ✅ | Local embeddings (sentence-transformers) |
| Source citations in responses | ✅ | Clickable links to document details |
| Chat conversation history | ✅ | Session-based |
| Document deletion | ✅ | Removes from Qdrant + SQLite |
| Health check endpoint | ✅ | `/api/health` |
| **LLM document intelligence** | ✅ | Auto-naming, summaries, metadata extraction |
| **Time-aware RAG** | ✅ | Date extraction, recency boost, temporal queries |
| **Timeline visualization** | ✅ | Event extraction, company/date filtering |
| **Documents management page** | ✅ | Browse, search, filter, download, delete |
| **Multi-page navigation** | ✅ | Chat, Documents, Timeline pages |
| **Original file download** | ✅ | Stored files available for download |

### Deferred (Phase 3+)

| Feature | Notes |
|---------|-------|
| User authentication | Can add OAuth/JWT |
| Multi-tenant data isolation | Requires auth first |
| Email integration | Gmail/Outlook API |
| CRM integration (HubSpot) | HubSpot API |
| ATS integration | Varies by provider |
| Real-time streaming responses | SSE implementation |
| Conversation history persistence | Currently session-based |
| XLSX/CSV support | Add pandas |
| Image OCR | Add pytesseract |

---

## Dependencies

```txt
# Core
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
python-multipart>=0.0.6

# LLM & Embeddings
anthropic>=0.40.0
sentence-transformers>=5.0.0

# LangChain
langchain>=0.3.0
langchain-anthropic>=0.3.0
langchain-text-splitters>=0.3.0

# Vector Database
qdrant-client>=1.7.0

# Database
sqlalchemy>=2.0.0
aiosqlite>=0.19.0
greenlet>=3.0.0

# Document Processing
pypdfium2>=4.0.0
python-docx>=1.1.0

# Utilities
python-dotenv>=1.0.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
aiofiles>=23.2.1
```

---

## Resources & References

### Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [LangChain RAG Tutorial](https://docs.langchain.com/oss/python/langchain/rag)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Sentence Transformers](https://www.sbert.net/)

### Research & Best Practices
- [RAG Best Practices (TowardsDataScience)](https://towardsdatascience.com/six-lessons-learned-building-rag-systems-in-production/)
- [Vector Database Comparison (DataCamp)](https://www.datacamp.com/blog/the-top-5-vector-databases)
- [Embedding Models Comparison](https://research.aimultiple.com/embedding-models/)
- [Qdrant How to Choose Embeddings](https://qdrant.tech/articles/how-to-choose-an-embedding-model/)
- [Qdrant FastEmbed](https://github.com/qdrant/fastembed)

### Templates & Examples
- [FastAPI + LangChain RAG](https://github.com/mazzasaverio/fastapi-langchain-rag)
- [LlamaIndex RAG Application](https://www.kdnuggets.com/building-a-rag-application-using-llamaindex)
- [Anthropic Claude Cookbooks](https://github.com/anthropics/claude-cookbooks)

---

## Future Enhancements

1. **Authentication**: Add OAuth2/JWT for multi-user support
2. **Streaming Responses**: SSE for real-time token streaming
3. **Email Integration**: Connect Gmail/Outlook for auto-ingestion
4. **CRM Integration**: HubSpot API for contact/company data
5. **Reranking**: Add cross-encoder reranking for better retrieval
6. **Document Types**: Add support for XLSX, images (OCR)
7. **Docker**: Containerize for easier deployment
8. **Hybrid Search**: Combine BM25 keyword search with vector search
9. **Query Rewriting**: LLM-based query expansion for better retrieval
10. **Company/Person Profiles**: Auto-generate profiles from extracted mentions
11. **Relationship Graph**: Visualize connections between companies, people, and documents
12. **Calendar Integration**: Sync timeline events with Google/Outlook calendars

---

## License

Private/Internal Use

---

*Built with Claude Code - January 2026*
