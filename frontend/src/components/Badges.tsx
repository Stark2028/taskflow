import type { ReactNode } from 'react'
import type { Role, TaskPriority, TaskStatus } from '../types'
import { PRIORITY_LABELS, ROLE_LABELS, STATUS_LABELS } from '../utils/taskMeta'
import { ClockIcon } from './Icons'
import { badgeTones, priorityTones, roleTones, statusTones, type BadgeTone } from './styles'

export function Badge({ tone = 'slate', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${badgeTones[tone]}`}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={statusTones[status]}>{STATUS_LABELS[status]}</Badge>
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge tone={priorityTones[priority]}>
      <span className="sr-only">Priority: </span>
      {PRIORITY_LABELS[priority]}
    </Badge>
  )
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white">
      <ClockIcon className="size-3.5" />
      Overdue
    </span>
  )
}

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={roleTones[role]}>{ROLE_LABELS[role]}</Badge>
}
