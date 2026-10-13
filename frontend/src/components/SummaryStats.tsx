import { useId } from 'react'
import type { DashboardSummary } from '../types'
import { StatCard } from './StatCard'
import { cardClass } from './styles'

interface SummaryStatsProps {
  summary: DashboardSummary
  /** Admin summary only: shown as an extra card. */
  totalUsers?: number
}

/** The stat cards + completion progress bar shared by the dashboard and admin pages. */
export function SummaryStats({ summary, totalUsers }: SummaryStatsProps) {
  const labelId = useId()
  const rate = Math.min(100, Math.max(0, summary.completion_rate))

  return (
    <div className="space-y-4">
      <div
        className={`grid grid-cols-2 gap-4 sm:grid-cols-3 ${totalUsers === undefined ? 'xl:grid-cols-6' : 'lg:grid-cols-4 xl:grid-cols-7'}`}
      >
        {totalUsers !== undefined && <StatCard label="Users" value={totalUsers} tone="indigo" />}
        <StatCard label="Total tasks" value={summary.total} tone="slate" />
        <StatCard label="Completed" value={summary.completed} tone="emerald" />
        <StatCard label="In progress" value={summary.in_progress} tone="blue" />
        <StatCard label="Pending" value={summary.pending} tone="amber" hint="Not started yet" />
        <StatCard label="Overdue" value={summary.overdue} tone="rose" />
        <StatCard label="Completion" value={`${rate.toFixed(1)}%`} tone="indigo" />
      </div>

      <div className={`${cardClass} p-4`}>
        <div className="flex items-baseline justify-between gap-4">
          <p id={labelId} className="text-sm font-medium text-slate-700">
            Completion progress
          </p>
          <p className="text-sm text-slate-500 tabular-nums">
            {summary.completed} of {summary.total} tasks completed
          </p>
        </div>
        <div
          role="progressbar"
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={rate}
          aria-valuetext={`${rate.toFixed(1)}%`}
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
        >
          <div className="h-full rounded-full bg-indigo-600" style={{ width: `${rate}%` }} />
        </div>
      </div>
    </div>
  )
}
