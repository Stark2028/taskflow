import type { TaskPriority, TaskStatus } from '../../types'
import { PRIORITIES, PRIORITY_LABELS, SORT_OPTIONS, STATUSES, STATUS_LABELS, type SortKey } from '../../utils/taskMeta'
import { Button } from '../Button'
import { SearchIcon } from '../Icons'
import { inputClass } from '../styles'

interface TaskFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: TaskStatus | undefined
  onStatusChange: (value: TaskStatus | undefined) => void
  priority: TaskPriority | undefined
  onPriorityChange: (value: TaskPriority | undefined) => void
  /** Omit both to hide the sort dropdown. */
  sort?: SortKey
  onSortChange?: (value: SortKey) => void
  /** Shown as a "Clear filters" button when provided. */
  onClear?: () => void
  /** Prefix for element ids, so two toolbars could live on one page. */
  idPrefix?: string
}

// The API rejects longer search terms with a 422.
const SEARCH_MAX_LENGTH = 100

/** Search box + status/priority filters (+ optional sort) used above task tables. */
export function TaskFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  sort,
  onSortChange,
  onClear,
  idPrefix = 'tasks',
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <div className="flex-1">
        <label htmlFor={`${idPrefix}-search`} className="mb-1.5 block text-xs font-medium text-slate-600">
          Search
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id={`${idPrefix}-search`}
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by title…"
            maxLength={SEARCH_MAX_LENGTH}
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
        <div className="sm:w-40">
          <label htmlFor={`${idPrefix}-status`} className="mb-1.5 block text-xs font-medium text-slate-600">
            Status
          </label>
          <select
            id={`${idPrefix}-status`}
            value={status ?? ''}
            onChange={(event) => onStatusChange((event.target.value || undefined) as TaskStatus | undefined)}
            className={inputClass}
          >
            <option value="">All statuses</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:w-40">
          <label htmlFor={`${idPrefix}-priority`} className="mb-1.5 block text-xs font-medium text-slate-600">
            Priority
          </label>
          <select
            id={`${idPrefix}-priority`}
            value={priority ?? ''}
            onChange={(event) => onPriorityChange((event.target.value || undefined) as TaskPriority | undefined)}
            className={inputClass}
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        {sort && onSortChange && (
          <div className="col-span-2 sm:w-48">
            <label htmlFor={`${idPrefix}-sort`} className="mb-1.5 block text-xs font-medium text-slate-600">
              Sort by
            </label>
            <select
              id={`${idPrefix}-sort`}
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SortKey)}
              className={inputClass}
            >
              {Object.entries(SORT_OPTIONS).map(([key, option]) => (
                <option key={key} value={key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {onClear && (
          <Button variant="ghost" onClick={onClear} className="col-span-2 sm:col-span-1">
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
