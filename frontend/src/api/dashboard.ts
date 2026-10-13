import type { DashboardSummary } from '../types'
import { api } from './client'

export const dashboardApi = {
  async getSummary(signal?: AbortSignal): Promise<DashboardSummary> {
    const { data } = await api.get<DashboardSummary>('/api/dashboard/summary', { signal })
    return data
  },
}
