import { Button } from './Button'
import { ArrowLeftIcon } from './Icons'

interface PaginationProps {
  /** 1-based page number. */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function Pagination({ page, pageSize, total, onPageChange, disabled = false }: PaginationProps) {
  if (total === 0) return null

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-slate-600">
        Showing <span className="font-medium text-slate-900">{from}</span>–
        <span className="font-medium text-slate-900">{to}</span> of{' '}
        <span className="font-medium text-slate-900">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <span className="mr-1 text-sm text-slate-500">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
        >
          <ArrowLeftIcon className="size-3.5" />
          Prev
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
        >
          Next
          <ArrowLeftIcon className="size-3.5 rotate-180" />
        </Button>
      </div>
    </nav>
  )
}
