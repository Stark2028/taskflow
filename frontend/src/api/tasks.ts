import type { CreateTaskPayload, Page, Task, TaskListParams, TaskPayload, TaskStatus } from '../types'
import { api, compactParams } from './client'

export const tasksApi = {
  async list(params: TaskListParams = {}, signal?: AbortSignal): Promise<Page<Task>> {
    const { data } = await api.get<Page<Task>>('/api/tasks', {
      params: compactParams(params),
      signal,
    })
    return data
  },

  async get(id: number, signal?: AbortSignal): Promise<Task> {
    const { data } = await api.get<Task>(`/api/tasks/${id}`, { signal })
    return data
  },

  async create(payload: CreateTaskPayload): Promise<Task> {
    const { data } = await api.post<Task>('/api/tasks', payload)
    return data
  },

  async update(id: number, payload: TaskPayload): Promise<Task> {
    const { data } = await api.put<Task>(`/api/tasks/${id}`, payload)
    return data
  },

  async updateStatus(id: number, status: TaskStatus): Promise<Task> {
    const { data } = await api.patch<Task>(`/api/tasks/${id}/status`, { status })
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/tasks/${id}`)
  },
}
