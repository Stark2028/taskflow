import type { Role, SortOrder, TaskPriority, TaskSortBy, TaskStatus } from '../types'

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export const ROLE_LABELS: Record<Role, string> = {
  USER: 'User',
  ADMIN: 'Admin',
}

export const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'COMPLETED']
export const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH']

export function isTaskStatus(value: string | null): value is TaskStatus {
  return STATUSES.includes(value as TaskStatus)
}

export function isTaskPriority(value: string | null): value is TaskPriority {
  return PRIORITIES.includes(value as TaskPriority)
}

/** The sort dropdown's options and the API params each one maps to. */
export const SORT_OPTIONS = {
  newest: { label: 'Newest first', sort_by: 'created_at', order: 'desc' },
  oldest: { label: 'Oldest first', sort_by: 'created_at', order: 'asc' },
  due: { label: 'Due date (soonest)', sort_by: 'due_date', order: 'asc' },
  priority: { label: 'Priority (high → low)', sort_by: 'priority', order: 'desc' },
} as const satisfies Record<string, { label: string; sort_by: TaskSortBy; order: SortOrder }>

export type SortKey = keyof typeof SORT_OPTIONS

export const DEFAULT_SORT: SortKey = 'newest'

export function isSortKey(value: string | null): value is SortKey {
  return value !== null && Object.hasOwn(SORT_OPTIONS, value)
}
