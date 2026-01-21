import { apiClient } from './client'
import type { TimelineResponse, TimelineFilters, CompaniesListResponse } from '@/types'

export const timelineApi = {
  getEvents: async (filters: TimelineFilters): Promise<TimelineResponse> => {
    const params = new URLSearchParams()
    if (filters.company) params.append('company', filters.company)
    if (filters.eventType) params.append('event_type', filters.eventType)
    if (filters.startDate) params.append('start_date', filters.startDate)
    if (filters.endDate) params.append('end_date', filters.endDate)

    const response = await apiClient.get<TimelineResponse>(`/timeline?${params.toString()}`)
    return response.data
  },

  getCompanies: async (): Promise<CompaniesListResponse> => {
    const response = await apiClient.get<CompaniesListResponse>('/timeline/companies')
    return response.data
  },
}
