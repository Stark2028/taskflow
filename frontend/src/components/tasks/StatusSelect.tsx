import type { TaskStatus } from '../../types'
import { STATUSES, STATUS_LABELS } from '../../utils/taskMeta'
import { ChevronDownIcon } from '../Icons'
import { badgeTones, statusTones } from '../styles'

interface StatusSelectProps {
  value: TaskStatus
  onChange: (status: TaskStatus) => void
  /** Accessible name, e.g. 'Status of "Write report"'. */
  label: string
  disabled?: boolean
}

/** A native <select> styled like a status badge, for changing status in place. */
export function StatusSelect({ value, onChange, label, disabled = false }: StatusSelectProps) {
  return (
    <span className="relative inline-flex">
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as TaskStatus)}
        className={`appearance-none rounded-full py-0.5 pr-7 pl-2.5 text-xs font-medium ring-1 ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-wait disabled:opacity-60 ${badgeTones[statusTones[value]]}`}
      >
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 opacity-70" />
    </span>
  )
}
