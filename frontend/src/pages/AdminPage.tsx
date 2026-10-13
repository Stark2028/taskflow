import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { adminApi } from '../api/admin'
import { getErrorMessage } from '../api/errors'
import { PriorityBadge, RoleBadge, StatusBadge } from '../components/Badges'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { ListIcon, SearchIcon, UserIcon } from '../components/Icons'
import { PageHeader } from '../components/PageHeader'
import { Pagination } from '../components/Pagination'
import { LoadingBlock } from '../components/Spinner'
import { SummaryStats } from '../components/SummaryStats'
import { cardClass } from '../components/styles'
import { DueDate } from '../components/tasks/DueDate'
import { TaskFilters } from '../components/tasks/TaskFilters'
import { useAuth } from '../context/useAuth'
import { useAsync } from '../hooks/useAsync'
import { useDebouncedCallback } from '../hooks/useDebouncedCallback'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { AdminUser, Role, TaskPriority, TaskStatus } from '../types'
import { formatDate } from '../utils/dates'

const USERS_PAGE_SIZE = 10
const TASKS_PAGE_SIZE = 10

const thClass = 'px-4 py-3 text-xs font-medium tracking-wide text-slate-500 uppercase'
const tdClass = 'px-4 py-3 align-top'

export function AdminPage() {
  useDocumentTitle('Admin')

  return (
    <>
      <PageHeader title="Admin" description="Everyone's users and tasks at a glance." />
      <div className="space-y-8">
        <SummarySection />
        <UsersSection />
        <AllTasksSection />
      </div>
    </>
  )
}

function SummarySection() {
  const { data, error, reload } = useAsync(adminApi.getSummary)

  return (
    <section aria-label="Summary">
      {error ? (
        <ErrorAlert title="Couldn't load the summary" message={getErrorMessage(error)} onRetry={reload} />
      ) : data ? (
        <SummaryStats summary={data} totalUsers={data.total_users} />
      ) : (
        <LoadingBlock label="Loading summary…" />
      )}
    </section>
  )
}

function SectionHeader({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="border-b border-slate-200 px-4 py-3">
      <h2 id={id} className="text-base font-semibold text-slate-900">
        {title}
      </h2>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

function UsersSection() {
  const { user: currentUser } = useAuth()
  const [page, setPage] = useState(1)

  const fetchUsers = useCallback(
    (signal: AbortSignal) =>
      adminApi.listUsers({ limit: USERS_PAGE_SIZE, offset: (page - 1) * USERS_PAGE_SIZE }, signal),
    [page],
  )
  const { data, error, loading, reload } = useAsync(fetchUsers)

  // The user whose role is about to change (drives the confirmation dialog).
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null)
  const [roleSaving, setRoleSaving] = useState(false)
  const [roleError, setRoleError] = useState<string | null>(null)
  const nextRole: Role = roleTarget?.role === 'ADMIN' ? 'USER' : 'ADMIN'

  async function confirmRoleChange() {
    if (!roleTarget) return
    setRoleSaving(true)
    setRoleError(null)
    try {
      await adminApi.updateUserRole(roleTarget.id, nextRole)
      setRoleTarget(null)
      reload()
    } catch (err) {
      setRoleError(getErrorMessage(err))
    } finally {
      setRoleSaving(false)
    }
  }

  function closeRoleDialog() {
    setRoleTarget(null)
    setRoleError(null)
  }

  let content
  if (error && !data) {
    content = (
      <div className="p-4">
        <ErrorAlert message={getErrorMessage(error)} onRetry={reload} />
      </div>
    )
  } else if (!data) {
    content = <LoadingBlock label="Loading users…" />
  } else if (data.items.length === 0) {
    content = <EmptyState icon={<UserIcon />} title="No users yet" />
  } else {
    content = (
      <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th scope="col" className={thClass}>Name</th>
              <th scope="col" className={thClass}>Email</th>
              <th scope="col" className={thClass}>Role</th>
              <th scope="col" className={`${thClass} text-right`}>Tasks</th>
              <th scope="col" className={thClass}>Joined</th>
              <th scope="col" className={thClass}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((user) => {
              const isSelf = user.id === currentUser?.id
              return (
                <tr key={user.id}>
                  <td className={`${tdClass} font-medium text-slate-900`}>
                    {user.full_name}
                    {isSelf && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}
                  </td>
                  <td className={`${tdClass} text-slate-600`}>{user.email}</td>
                  <td className={tdClass}>
                    <RoleBadge role={user.role} />
                  </td>
                  <td className={`${tdClass} text-right text-slate-700 tabular-nums`}>{user.task_count}</td>
                  <td className={`${tdClass} whitespace-nowrap text-slate-600`}>{formatDate(user.created_at)}</td>
                  <td className={`${tdClass} text-right`}>
                    {/* Admins can't change their own role (the API rejects it with 400 anyway). */}
                    {!isSelf && (
                      <Button variant="secondary" size="sm" onClick={() => setRoleTarget(user)}>
                        {user.role === 'ADMIN' ? 'Make user' : 'Make admin'}
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <section aria-labelledby="users-heading" className={cardClass}>
      <SectionHeader id="users-heading" title="Users" description="Everyone with a TaskFlow account." />
      {error != null && data && (
        <div className="px-4 pt-4">
          <ErrorAlert message={getErrorMessage(error)} onRetry={reload} />
        </div>
      )}
      {content}
      {data && (
        <Pagination
          page={page}
          pageSize={USERS_PAGE_SIZE}
          total={data.total}
          onPageChange={setPage}
          disabled={loading}
        />
      )}

      <ConfirmDialog
        open={roleTarget !== null}
        title={nextRole === 'ADMIN' ? 'Grant admin access?' : 'Remove admin access?'}
        message={
          nextRole === 'ADMIN' ? (
            <>
              <strong className="text-slate-900">{roleTarget?.full_name}</strong> will be able to see every
              user and every task.
            </>
          ) : (
            <>
              <strong className="text-slate-900">{roleTarget?.full_name}</strong> will become a regular user and
              lose access to the admin area.
            </>
          )
        }
        confirmLabel={nextRole === 'ADMIN' ? 'Make admin' : 'Make user'}
        tone={nextRole === 'ADMIN' ? 'primary' : 'danger'}
        loading={roleSaving}
        error={roleError}
        onConfirm={confirmRoleChange}
        onCancel={closeRoleDialog}
      />
    </section>
  )
}

// ---------------------------------------------------------------------------
// All tasks
// ---------------------------------------------------------------------------

function AllTasksSection() {
  // Unlike /tasks, these filters are plain component state: there are two tables on
  // this page, and URL-syncing both would add complexity for little benefit.
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TaskStatus | undefined>()
  const [priority, setPriority] = useState<TaskPriority | undefined>()
  const [page, setPage] = useState(1)

  // Wait until typing pauses before searching (see useDebouncedCallback).
  const commitSearch = useDebouncedCallback((value: string) => {
    setSearch(value.trim())
    setPage(1)
  }, 300)

  function handleSearchChange(value: string) {
    setSearchInput(value)
    commitSearch(value)
  }

  const hasFilters = Boolean(search || status || priority)

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setStatus(undefined)
    setPriority(undefined)
    setPage(1)
  }

  const fetchTasks = useCallback(
    (signal: AbortSignal) =>
      adminApi.listTasks(
        { search, status, priority, limit: TASKS_PAGE_SIZE, offset: (page - 1) * TASKS_PAGE_SIZE },
        signal,
      ),
    [search, status, priority, page],
  )
  const { data, error, loading, reload } = useAsync(fetchTasks)

  let content
  if (error && !data) {
    content = (
      <div className="p-4">
        <ErrorAlert message={getErrorMessage(error)} onRetry={reload} />
      </div>
    )
  } else if (!data || (loading && data.items.length === 0)) {
    content = <LoadingBlock label="Loading tasks…" />
  } else if (data.items.length === 0) {
    content = hasFilters ? (
      <EmptyState
        icon={<SearchIcon />}
        title="No tasks match your filters"
        action={
          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState icon={<ListIcon />} title="No tasks yet" description="Nobody has created a task so far." />
    )
  } else {
    content = (
      <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th scope="col" className={thClass}>Title</th>
              <th scope="col" className={thClass}>Owner</th>
              <th scope="col" className={thClass}>Status</th>
              <th scope="col" className={thClass}>Priority</th>
              <th scope="col" className={thClass}>Due</th>
              <th scope="col" className={thClass}>Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((task) => (
              <tr key={task.id} className={task.is_overdue ? 'bg-rose-50/40' : undefined}>
                <td className={`${tdClass} max-w-xs`}>
                  <Link
                    to={`/tasks/${task.id}`}
                    className="font-medium break-words text-slate-900 hover:text-indigo-600 hover:underline"
                  >
                    {task.title}
                  </Link>
                </td>
                <td className={tdClass}>
                  <p className="font-medium text-slate-900">{task.owner.full_name}</p>
                  <p className="text-xs text-slate-500">{task.owner.email}</p>
                </td>
                <td className={tdClass}>
                  <StatusBadge status={task.status} />
                </td>
                <td className={tdClass}>
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className={tdClass}>
                  <DueDate task={task} />
                </td>
                <td className={`${tdClass} whitespace-nowrap text-slate-600`}>{formatDate(task.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <section aria-labelledby="all-tasks-heading" className={cardClass}>
      <SectionHeader id="all-tasks-heading" title="All tasks" description="Tasks from every user, newest first." />
      <div className="border-b border-slate-200 p-4">
        <TaskFilters
          idPrefix="admin-tasks"
          search={searchInput}
          onSearchChange={handleSearchChange}
          status={status}
          onStatusChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
          priority={priority}
          onPriorityChange={(value) => {
            setPriority(value)
            setPage(1)
          }}
          onClear={hasFilters || searchInput ? clearFilters : undefined}
        />
      </div>
      {error != null && data && (
        <div className="px-4 pt-4">
          <ErrorAlert message={getErrorMessage(error)} onRetry={reload} />
        </div>
      )}
      {content}
      {data && data.items.length > 0 && (
        <Pagination
          page={page}
          pageSize={TASKS_PAGE_SIZE}
          total={data.total}
          onPageChange={setPage}
          disabled={loading}
        />
      )}
    </section>
  )
}
