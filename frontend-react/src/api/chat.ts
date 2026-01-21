import { apiClient } from './client'
import type { ChatRequest, ChatResponse } from '@/types'

export const chatApi = {
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/chat', data)
    return response.data
  },
}
