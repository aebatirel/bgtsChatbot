import { apiClient } from './client'
import type {
  DocumentUploadResponse,
  DocumentSaveRequest,
  DocumentSaveResponse,
  DocumentListResponse,
  Document,
} from '@/types'

export const documentsApi = {
  upload: async (file: File): Promise<DocumentUploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<DocumentUploadResponse>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  save: async (data: DocumentSaveRequest): Promise<DocumentSaveResponse> => {
    const response = await apiClient.post<DocumentSaveResponse>('/documents/save', data)
    return response.data
  },

  list: async (): Promise<DocumentListResponse> => {
    const response = await apiClient.get<DocumentListResponse>('/documents')
    return response.data
  },

  get: async (id: number): Promise<Document> => {
    const response = await apiClient.get<Document>(`/documents/${id}`)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/documents/${id}`)
  },

  getDownloadUrl: (id: number): string => `/api/documents/${id}/download`,
}
