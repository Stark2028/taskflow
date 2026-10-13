import { Link } from 'react-router'
import type { Task, TaskStatus } from '../../types'
import { PriorityBadge } from '../Badges'
import { CheckIcon, PencilIcon, TrashIcon } from '../Icons'
import { DueDate } from './DueDate'
import { StatusSelect } from './StatusSelect'

interface TaskListProps {
  tasks: Task[]
  /** id of a task with a request in flight; its controls are disabled. */
  busyTaskId: number | null
  onStatusChange: (task: Task, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

/** The user's tasks: a table on md+ screens, stacked cards on mobile. */
export function TaskList(props: TaskListProps) {
  return (
    <>
      <TaskTable {...props} />
      <TaskCards {...props} />
    </>
  )
}

function TaskTable({ tasks, busyTaskId, onStatusChange, onEdit, onDelete }: TaskListProps) {
  return (
    <div className="hidden md:block">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
          <tr>
            <th scope="col" className="w-12 px-4 py-3">
              <span className="sr-only">Done</span>
            </th>
            <th scope="col" className="px-2 py-3">Title</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Priority</th>
            <th scope="col" className="px-4 py-3">Due</th>
            <th scope="col" className="px-4 py-3 text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => {
            const busy = busyTaskId === task.id
            return (
              <tr key={task.id} className={task.is_overdue ? 'bg-rose-50/40' : undefined}>
                <td className="px-4 py-3 align-top">
                  <CompleteToggle task={task} disabled={busy} onStatusChange={onStatusChange} />
                </td>
                <td className="max-w-xs px-2 py-3 align-top">
                  <TaskTitle task={task} />
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusSelect
                    value={task.status}
                    label={`Status of "${task.title}"`}
                    disabled={busy}
                    onChange={(status) => onStatusChange(task, status)}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-3 align-top">
                  <DueDate task={task} />
                </td>
                <td className="px-4 py-3 align-top">
                  <RowActions task={task} disabled={busy} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TaskCards({ tasks, busyTaskId, onStatusChange, onEdit, onDelete }: TaskListProps) {
  return (
    <ul className="divide-y divide-slate-100 md:hidden">
      {tasks.map((task) => {
        const busy = busyTaskId === task.id
        return (
          <li key={task.id} className={`flex gap-3 p-4 ${task.is_overdue ? 'bg-rose-50/40' : ''}`}>
            <CompleteToggle task={task} disabled={busy} onStatusChange={onStatusChange} />
            <div className="min-w-0 flex-1 space-y-3">
              <TaskTitle task={task} />
              <div className="flex flex-wrap items-center gap-2">
                <StatusSelect
                  value={task.status}
                  label={`Status of "${task.title}"`}
                  disabled={busy}
                  onChange={(status) => onStatusChange(task, status)}
                />
                <PriorityBadge priority={task.priority} />
              </div>
              <div className="flex items-end justify-between gap-3">
                <DueDate task={task} />
                <RowActions task={task} disabled={busy} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function TaskTitle({ task }: { task: Task }) {
  const done = task.status === 'COMPLETED'
  return (
    <div className="min-w-0">
      <Link
        to={`/tasks/${task.id}`}
        className={`font-medium break-words hover:text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600 ${
          done ? 'text-slate-500 line-through' : 'text-slate-900'
        }`}
      >
        {task.title}
      </Link>
      {task.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{task.description}</p>}
    </div>
  )
}

interface CompleteToggleProps {
  task: Task
  disabled: boolean
  onStatusChange: (task: Task, status: TaskStatus) => void
}

/** Round checkbox-style button: marks the task completed, or reopens it as "To do". */
function CompleteToggle({ task, disabled, onStatusChange }: CompleteToggleProps) {
  const done = task.status === 'COMPLETED'
  const label = done ? `Mark "${task.title}" as not completed` : `Mark "${task.title}" as completed`

  return (
    <button
      type="button"
      onClick={() => onStatusChange(task, done ? 'TODO' : 'COMPLETED')}
      disabled={disabled}
      aria-label={label}
      title={done ? 'Mark as not completed' : 'Mark complete'}
      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-50 ${
        done
          ? 'border-emerald-500 bg-emerald-500 text-white'
          : 'border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500'
      }`}
    >
      <CheckIcon className="size-3" />
    </button>
  )
}

interface RowActionsProps {
  task: Task
  disabled: boolean
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

function RowActions({ task, disabled, onEdit, onDelete }: RowActionsProps) {
  const iconButton =
    'rounded-md p-1.5 text-slate-500 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50'
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        onClick={() => onEdit(task)}
        disabled={disabled}
        aria-label={`Edit "${task.title}"`}
        title="Edit"
        className={`${iconButton} hover:bg-slate-100 hover:text-slate-900`}
      >
        <PencilIcon className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(task)}
        disabled={disabled}
        aria-label={`Delete "${task.title}"`}
        title="Delete"
        className={`${iconButton} hover:bg-rose-50 hover:text-rose-600`}
      >
        <TrashIcon className="size-4" />
      </button>
    </div>
  )
}
