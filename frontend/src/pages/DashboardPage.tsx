import { Link } from 'react-router'
import { dashboardApi } from '../api/dashboard'
import { getErrorMessage } from '../api/errors'
import { tasksApi } from '../api/tasks'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { ClockIcon } from '../components/Icons'
import { PageHeader } from '../components/PageHeader'
import { LoadingBlock } from '../components/Spinner'
import { SummaryStats } from '../components/SummaryStats'
import { DueDate } from '../components/tasks/DueDate'
import { buttonClass, cardClass } from '../components/styles'
import { useAuth } from '../context/useAuth'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { Task, TaskStatus } from '../types'

const UPCOMING_LIMIT = 5
const OPEN_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS']

/**
 * The next deadlines among unfinished tasks (overdue ones come first).
 * The API filters by a single status, so we ask for the earliest-due TODO and
 * IN_PROGRESS tasks separately and merge them. A single unfiltered query could
 * return only old completed tasks, since those tend to have the earliest due dates.
 */
async function fetchUpcomingTasks(signal: AbortSignal): Promise<Task[]> {
  const pages = await Promise.all(
    OPEN_STATUSES.map((status) =>
      tasksApi.list({ status, sort_by: 'due_date', order: 'asc', limit: UPCOMING_LIMIT }, signal),
    ),
  )
  return pages
    .flatMap((page) => page.items)
    .filter((task): task is Task & { due_date: string } => task.due_date !== null && task.status !== 'COMPLETED')
    .sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date))
    .slice(0, UPCOMING_LIMIT)
}

export function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { user } = useAuth()

  const summary = useAsync(dashboardApi.getSummary)
  const upcoming = useAsync(fetchUpcomingTasks)

  const firstName = user?.full_name.split(' ')[0] ?? ''

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
        description="Here's an overview of your tasks."
        actions={
          <Link to="/tasks" className={buttonClass('secondary')}>
            View all tasks
          </Link>
        }
      />

      <section aria-labelledby="summary-heading" className="mb-8">
        <h2 id="summary-heading" className="sr-only">
          Summary
        </h2>
        {summary.error ? (
          <ErrorAlert
            title="Couldn't load your summary"
            message={getErrorMessage(summary.error)}
            onRetry={summary.reload}
          />
        ) : summary.data ? (
          <SummaryStats summary={summary.data} />
        ) : (
          <LoadingBlock label="Loading summary…" />
        )}
      </section>

      <section aria-labelledby="upcoming-heading" className={cardClass}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 id="upcoming-heading" className="text-base font-semibold text-slate-900">
            Upcoming deadlines
          </h2>
          <Link to="/tasks?sort=due" className="text-sm font-medium text-indigo-600 hover:underline">
            See all
          </Link>
        </div>

        {upcoming.error ? (
          <div className="p-4">
            <ErrorAlert message={getErrorMessage(upcoming.error)} onRetry={upcoming.reload} />
          </div>
        ) : !upcoming.data ? (
          <LoadingBlock label="Loading deadlines…" />
        ) : upcoming.data.length === 0 ? (
          <EmptyState
            icon={<ClockIcon />}
            title="No upcoming deadlines"
            description="Unfinished tasks with a due date will show up here."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcoming.data.map((task) => (
              <li
                key={task.id}
                className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                  task.is_overdue ? 'border-l-4 border-rose-500 bg-rose-50/50' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <Link
                    to={`/tasks/${task.id}`}
                    className="block truncate font-medium text-slate-900 hover:text-indigo-600 hover:underline"
                  >
                    {task.title}
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>
                <div className="shrink-0">
                  <DueDate task={task} align="end" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
