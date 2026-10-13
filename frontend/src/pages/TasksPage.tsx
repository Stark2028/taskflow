import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getErrorMessage } from '../api/errors'
import { tasksApi } from '../api/tasks'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { ListIcon, PlusIcon, SearchIcon } from '../components/Icons'
import { PageHeader } from '../components/PageHeader'
import { Pagination } from '../components/Pagination'
import { LoadingBlock } from '../components/Spinner'
import { cardClass } from '../components/styles'
import { DeleteTaskDialog } from '../components/tasks/DeleteTaskDialog'
import { TaskFilters } from '../components/tasks/TaskFilters'
import { TaskFormModal } from '../components/tasks/TaskFormModal'
import { TaskList } from '../components/tasks/TaskList'
import { useAsync } from '../hooks/useAsync'
import { useDebouncedCallback } from '../hooks/useDebouncedCallback'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { Task, TaskStatus } from '../types'
import { DEFAULT_SORT, isSortKey, isTaskPriority, isTaskStatus, SORT_OPTIONS } from '../utils/taskMeta'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

function parsePage(value: string | null): number {
  const page = Number.parseInt(value ?? '', 10)
  return Number.isFinite(page) && page > 1 ? page : 1
}

/** "1 task", "12 tasks", "3 tasks match your filters"… */
function describeCount(total: number, filtered: boolean): string {
  const noun = total === 1 ? 'task' : 'tasks'
  if (!filtered) return `${total} ${noun}`
  return `${total} ${noun} ${total === 1 ? 'matches' : 'match'} your filters`
}

export function TasksPage() {
  useDocumentTitle('My Tasks')

  // ---- Filters live in the URL (?q=&status=&priority=&sort=&page=) ----
  // That makes them survive a refresh, work with Back/Forward, and be shareable.
  const [searchParams, setSearchParams] = useSearchParams()
  const urlSearch = searchParams.get('q') ?? ''
  const statusParam = searchParams.get('status')
  const status = isTaskStatus(statusParam) ? statusParam : undefined
  const priorityParam = searchParams.get('priority')
  const priority = isTaskPriority(priorityParam) ? priorityParam : undefined
  const sortParam = searchParams.get('sort')
  const sort = isSortKey(sortParam) ? sortParam : DEFAULT_SORT
  const page = parsePage(searchParams.get('page'))

  /** Set or remove (null/'') query params, keeping the others. */
  const updateParams = useCallback(
    (changes: Record<string, string | null>, options?: { replace?: boolean }) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      }, options)
    },
    [setSearchParams],
  )

  // ---- Debounced search ----
  // The input updates on every keystroke, but the URL (and therefore the API request)
  // only changes once the user has stopped typing for 300 ms.
  const [searchInput, setSearchInput] = useState(urlSearch)
  const commitSearch = useDebouncedCallback((value: string) => {
    updateParams({ q: value, page: null }, { replace: true })
  }, SEARCH_DEBOUNCE_MS)

  function handleSearchChange(value: string) {
    setSearchInput(value)
    commitSearch(value)
  }

  // If the URL's search changes from elsewhere (Back button, "Clear filters"), mirror it in
  // the input. Adjusting state during render is React's recommended alternative to an effect.
  const [lastUrlSearch, setLastUrlSearch] = useState(urlSearch)
  if (urlSearch !== lastUrlSearch) {
    setLastUrlSearch(urlSearch)
    setSearchInput(urlSearch)
  }

  // ---- Data ----
  const search = urlSearch.trim()
  const { sort_by, order } = SORT_OPTIONS[sort]
  const fetchTasks = useCallback(
    (signal: AbortSignal) =>
      tasksApi.list(
        { status, priority, search, sort_by, order, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
        signal,
      ),
    [status, priority, search, sort_by, order, page],
  )
  const { data, error, loading, reload, setData } = useAsync(fetchTasks)

  // If the page no longer exists (e.g. we deleted its last task), go to the last real page.
  const lastPage = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  useEffect(() => {
    if (!loading && data && page > lastPage) {
      updateParams({ page: lastPage > 1 ? String(lastPage) : null }, { replace: true })
    }
  }, [loading, data, page, lastPage, updateParams])

  const hasFilters = Boolean(search || status || priority)

  function clearFilters() {
    setSearchInput('')
    updateParams({ q: null, status: null, priority: null, page: null })
  }

  // ---- Row actions ----
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleStatusChange(task: Task, newStatus: TaskStatus) {
    setBusyTaskId(task.id)
    setActionError(null)
    try {
      const updated = await tasksApi.updateStatus(task.id, newStatus)
      // Show the new status right away, then refetch in case the task no longer
      // matches the current filters/sort.
      setData((prev) => prev && { ...prev, items: prev.items.map((t) => (t.id === updated.id ? updated : t)) })
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setBusyTaskId(null)
    }
  }

  // ---- Create / edit modal ----
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  function openCreateForm() {
    setEditingTask(null)
    setFormOpen(true)
  }

  function openEditForm(task: Task) {
    setEditingTask(task)
    setFormOpen(true)
  }

  function handleSaved() {
    const wasCreating = editingTask === null
    setFormOpen(false)
    // New tasks appear on the first page with the default sort.
    if (wasCreating && page !== 1) updateParams({ page: null })
    reload()
  }

  // ---- Delete ----
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  function handleDeleted() {
    setTaskToDelete(null)
    reload()
  }

  // ---- Render ----
  let content
  if (error && !data) {
    content = (
      <div className="p-4">
        <ErrorAlert title="Couldn't load tasks" message={getErrorMessage(error)} onRetry={reload} />
      </div>
    )
  } else if (!data || (loading && data.items.length === 0)) {
    content = <LoadingBlock label="Loading tasks…" />
  } else if (data.items.length === 0) {
    content = hasFilters ? (
      <EmptyState
        icon={<SearchIcon />}
        title="No tasks match your filters"
        description="Try a different search term or clear the filters."
        action={
          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={<ListIcon />}
        title="No tasks yet"
        description="Create your first task to start tracking your work."
        action={
          <Button onClick={openCreateForm}>
            <PlusIcon className="size-4" />
            New task
          </Button>
        }
      />
    )
  } else {
    content = (
      <div aria-busy={loading} className={loading ? 'opacity-60' : undefined}>
        {error != null && (
          <div className="p-4 pb-0">
            <ErrorAlert message={getErrorMessage(error)} onRetry={reload} />
          </div>
        )}
        <TaskList
          tasks={data.items}
          busyTaskId={busyTaskId}
          onStatusChange={handleStatusChange}
          onEdit={openEditForm}
          onDelete={setTaskToDelete}
        />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="My Tasks"
        description={data ? describeCount(data.total, hasFilters) : 'Track, filter and update your work.'}
        actions={
          <Button onClick={openCreateForm}>
            <PlusIcon className="size-4" />
            New task
          </Button>
        }
      />

      <div className={cardClass}>
        <div className="border-b border-slate-200 p-4">
          <TaskFilters
            search={searchInput}
            onSearchChange={handleSearchChange}
            status={status}
            onStatusChange={(value) => updateParams({ status: value ?? null, page: null })}
            priority={priority}
            onPriorityChange={(value) => updateParams({ priority: value ?? null, page: null })}
            sort={sort}
            onSortChange={(value) => updateParams({ sort: value === DEFAULT_SORT ? null : value, page: null })}
            onClear={hasFilters || searchInput ? clearFilters : undefined}
          />
        </div>

        {actionError && (
          <div className="px-4 pt-4">
            <ErrorAlert message={actionError} onDismiss={() => setActionError(null)} />
          </div>
        )}

        {content}

        {data && data.items.length > 0 && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data.total}
            disabled={loading}
            onPageChange={(next) => updateParams({ page: next > 1 ? String(next) : null })}
          />
        )}
      </div>

      <TaskFormModal
        open={formOpen}
        task={editingTask}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <DeleteTaskDialog task={taskToDelete} onClose={() => setTaskToDelete(null)} onDeleted={handleDeleted} />
    </>
  )
}
