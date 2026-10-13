// Shapes of the data exchanged with the TaskFlow API.

export type Role = 'USER' | 'ADMIN'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface User {
  id: number
  full_name: string
  email: string
  role: Role
  created_at: string
}

export interface AdminUser extends User {
  task_count: number
}

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  /** ISO 8601 with timezone offset, or null when the task has no deadline. */
  due_date: string | null
  owner_id: number
  created_at: string
  updated_at: string
  /** Computed by the backend: due_date < now and status != COMPLETED. */
  is_overdue: boolean
}

export interface TaskOwner {
  id: number
  full_name: string
  email: string
}

export interface TaskWithOwner extends Task {
  owner: TaskOwner
}

export interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface DashboardSummary {
  total: number
  completed: number
  in_progress: number
  /** Number of TODO tasks. */
  pending: number
  overdue: number
  /** Percentage 0–100 with one decimal. */
  completion_rate: number
}

export interface AdminSummary extends DashboardSummary {
  total_users: number
}

export interface Token {
  access_token: string
  token_type: 'bearer'
  /** Lifetime in seconds. */
  expires_in: number
}

// ---- Request payloads ----

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
}

export interface UpdateProfilePayload {
  full_name?: string
  current_password?: string
  new_password?: string
}

/** Body for PUT /api/tasks/{id}: every key is required (nullable ones may be null). */
export interface TaskPayload {
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
}

/** Body for POST /api/tasks: only the title is required (status/priority get server defaults). */
export type CreateTaskPayload = Pick<TaskPayload, 'title'> & Partial<TaskPayload>

export type TaskSortBy = 'created_at' | 'due_date' | 'priority'
export type SortOrder = 'asc' | 'desc'

export interface TaskListParams {
  status?: TaskStatus
  priority?: TaskPriority
  search?: string
  sort_by?: TaskSortBy
  order?: SortOrder
  limit?: number
  offset?: number
}

export interface AdminTaskListParams extends TaskListParams {
  owner_id?: number
}

export interface PaginationParams {
  limit?: number
  offset?: number
}
