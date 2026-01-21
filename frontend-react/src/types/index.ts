// Chat types
export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  sources?: SourceDocument[]
  timestamp?: string
}

export interface SourceDocument {
  document_id: number
  filename: string
  snippet: string
  relevance_score: number
}

export interface ChatRequest {
  message: string
  conversation_id?: number | null
  use_knowledge_base: boolean
}

export interface ChatResponse {
  message: string
  conversation_id: number
  sources: SourceDocument[]
}

// Document types
export interface Document {
  id: number
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  content_preview?: string
  full_text?: string
  chunk_count: number
  is_indexed: boolean
  created_at: string
  updated_at: string
  generated_name?: string
  summary?: string
  document_type?: string
  primary_date?: string
  date_range_start?: string
  date_range_end?: string
  companies?: string[]
  people?: string[]
  is_timeless?: boolean
  date_uncertain?: boolean
}

export interface DocumentFilters {
  type: string
  search: string
}

export interface DocumentUploadResponse {
  upload_id: string
  filename: string
  file_type: string
  file_size: number
  preview: string
  full_text_length: number
  message: string
}

export interface DocumentSaveRequest {
  upload_id: string
  custom_name?: string
  user_provided_date?: string
}

export interface DocumentSaveResponse {
  id: number
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  content_preview?: string
  chunk_count: number
  is_indexed: boolean
  created_at: string
  updated_at: string
  generated_name?: string
  summary?: string
  document_type?: string
  primary_date?: string
  companies?: string[]
  people?: string[]
  is_timeless?: boolean
  date_uncertain?: boolean
}

export interface DocumentListResponse {
  documents: Document[]
  total_count: number
}

// Timeline types
export interface TimelineEvent {
  id: number
  document_id: number
  event_date: string
  event_type: string
  title: string
  description?: string
  companies: string[]
  people: string[]
  document_filename?: string
}

export interface TimelineFilters {
  company: string
  eventType: string
  startDate: string
  endDate: string
}

export interface TimelineResponse {
  events: TimelineEvent[]
  total_count: number
  date_range_start?: string
  date_range_end?: string
}

export interface CompaniesListResponse {
  companies: string[]
}
