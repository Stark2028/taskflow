import { useCallback, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getErrorMessage, getErrorStatus } from '../api/errors'
import { tasksApi } from '../api/tasks'
import { OverdueBadge, PriorityBadge, StatusBadge } from '../components/Badges'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { AlertIcon, ArrowLeftIcon, PencilIcon, SearchIcon, TrashIcon } from '../components/Icons'
import { LoadingBlock } from '../components/Spinner'
import { buttonClass, cardClass } from '../components/styles'
import { DeleteTaskDialog } from '../components/tasks/DeleteTaskDialog'
import { StatusSelect } from '../components/tasks/StatusSelect'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { useAuth } from '../context/useAuth'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { Task, TaskStatus } from '../types'
import { formatDateTime, formatRelative } from '../utils/dates'

export function TaskDetailPage() {
  const { id } = useParams()
  const taskId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const fetchTask = useCallback((signal: AbortSignal) => tasksApi.get(taskId, signal), [taskId])
  const { data: task, error, reload, setData } = useAsync(fetchTask)

  useDocumentTitle(task?.title ?? 'Task')

  const [statusSaving, setStatusSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)

  // Admins can open anyone's task (e.g. from the admin page); send them back there.
  const isOwnTask = !task || task.owner_id === user?.id
  const backTo = isOwnTask ? '/tasks' : '/admin'
  const backLabel = isOwnTask ? 'Back to tasks' : 'Back to admin'

  async function handleStatusChange(status: TaskStatus) {
    if (!task) return
    setStatusSaving(true)
    setActionError(null)
    try {
      const updated = await tasksApi.updateStatus(task.id, status)
      setData(() => updated)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setStatusSaving(false)
    }
  }

  const backLink = (
    <Link
      to={backTo}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
    >
      <ArrowLeftIcon className="size-4" />
      {backLabel}
    </Link>
  )

  if (error) {
    // 404: no such task, or it belongs to someone else. 422: the id in the URL isn't a number.
    const status = getErrorStatus(error)
    if (status === 404 || status === 422) {
      return (
        <>
          {backLink}
          <div className={cardClass}>
            <EmptyState
              icon={<SearchIcon />}
              title="Task not found"
              description="This task doesn't exist, was deleted, or you don't have access to it."
              action={
                <Link to="/tasks" className={buttonClass('secondary')}>
                  Go to my tasks
                </Link>
              }
            />
          </div>
        </>
      )
    }
    return (
      <>
        {backLink}
        <ErrorAlert title="Couldn't load this task" message={getErrorMessage(error)} onRetry={reload} />
      </>
    )
  }

  // Also covers switching between tasks: don't show the previous task while loading.
  if (!task || task.id !== taskId) {
    return <LoadingBlock label="Loading task…" />
  }

  return (
    <>
      {backLink}

      <article className={cardClass}>
        <header className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="min-w-0 space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight break-words text-slate-900">{task.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.is_overdue && <OverdueBadge />}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <PencilIcon className="size-4" />
              Edit
            </Button>
            <Button variant="danger-outline" onClick={() => setDeleteTarget(task)}>
              <TrashIcon className="size-4" />
              Delete
            </Button>
          </div>
        </header>

        <div className="space-y-4 p-5 sm:p-6">
          {actionError && <ErrorAlert message={actionError} onDismiss={() => setActionError(null)} />}

          {task.is_overdue && task.due_date && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            >
              <AlertIcon className="mt-0.5 size-5 shrink-0 text-rose-500" />
              <p>
                This task is overdue. It was due <strong>{formatRelative(task.due_date)}</strong> (
                {formatDateTime(task.due_date)}).
              </p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2" aria-labelledby="description-heading">
              <h2 id="description-heading" className="text-sm font-semibold text-slate-900">
                Description
              </h2>
              {task.description ? (
                <p className="mt-2 text-sm leading-6 break-words whitespace-pre-wrap text-slate-700">
                  {task.description}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-400 italic">No description.</p>
              )}
            </section>

            <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
              <DetailRow label="Status">
                <StatusSelect
                  value={task.status}
                  label="Change status"
                  disabled={statusSaving}
                  onChange={handleStatusChange}
                />
              </DetailRow>
              <DetailRow label="Priority">
                <PriorityBadge priority={task.priority} />
              </DetailRow>
              <DetailRow label="Due date">
                {task.due_date ? (
                  <span className={task.is_overdue ? 'font-medium text-rose-700' : undefined}>
                    {formatDateTime(task.due_date)}
                  </span>
                ) : (
                  <span className="text-slate-400">No due date</span>
                )}
              </DetailRow>
              <DetailRow label="Created">{formatDateTime(task.created_at)}</DetailRow>
              <DetailRow label="Last updated">{formatDateTime(task.updated_at)}</DetailRow>
              {!isOwnTask && <DetailRow label="Owner">User #{task.owner_id}</DetailRow>}
            </dl>
          </div>
        </div>
      </article>

      <TaskFormModal
        open={editOpen}
        task={task}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          setData(() => updated)
          setEditOpen(false)
        }}
      />

      <DeleteTaskDialog
        task={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => navigate(backTo, { replace: true })}
      />
    </>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-900">{children}</dd>
    </div>
  )
}
