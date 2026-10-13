import type { Task } from '../../types'
import { formatDateTime, formatRelative } from '../../utils/dates'
import { OverdueBadge } from '../Badges'

interface DueDateProps {
  task: Pick<Task, 'due_date' | 'is_overdue' | 'status'>
  /** "end" right-aligns the content from the sm breakpoint up. */
  align?: 'start' | 'end'
}

/** Due date cell: the date, plus an Overdue badge or a relative hint ("in 2 days"). */
export function DueDate({ task, align = 'start' }: DueDateProps) {
  if (!task.due_date) {
    return <span className="text-sm text-slate-400">No due date</span>
  }

  return (
    <div className={`flex flex-col items-start gap-1 ${align === 'end' ? 'sm:items-end' : ''}`}>
      <time
        dateTime={task.due_date}
        className={`text-sm whitespace-nowrap ${task.is_overdue ? 'font-medium text-rose-700' : 'text-slate-700'}`}
      >
        {formatDateTime(task.due_date)}
      </time>
      {task.is_overdue ? (
        <OverdueBadge />
      ) : (
        task.status !== 'COMPLETED' && (
          <span className="text-xs text-slate-500">{formatRelative(task.due_date)}</span>
        )
      )}
    </div>
  )
}
