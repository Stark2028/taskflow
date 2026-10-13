import type {
  AdminSummary,
  AdminTaskListParams,
  AdminUser,
  Page,
  PaginationParams,
  Role,
  TaskWithOwner,
  User,
} from '../types'
import { api, compactParams } from './client'

export const adminApi = {
  async getSummary(signal?: AbortSignal): Promise<AdminSummary> {
    const { data } = await api.get<AdminSummary>('/api/admin/summary', { signal })
    return data
  },

  async listUsers(params: PaginationParams = {}, signal?: AbortSignal): Promise<Page<AdminUser>> {
    const { data } = await api.get<Page<AdminUser>>('/api/admin/users', {
      params: compactParams(params),
      signal,
    })
    return data
  },

  async updateUserRole(id: number, role: Role): Promise<User> {
    const { data } = await api.patch<User>(`/api/admin/users/${id}/role`, { role })
    return data
  },

  async listTasks(params: AdminTaskListParams = {}, signal?: AbortSignal): Promise<Page<TaskWithOwner>> {
    const { data } = await api.get<Page<TaskWithOwner>>('/api/admin/tasks', {
      params: compactParams(params),
      signal,
    })
    return data
  },
}
