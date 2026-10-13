import { cardClass } from './styles'

type StatTone = 'slate' | 'indigo' | 'emerald' | 'blue' | 'amber' | 'rose'

// A thin colored bar on the left gives each card a quick visual identity.
const accentClasses: Record<StatTone, string> = {
  slate: 'bg-slate-400',
  indigo: 'bg-indigo-600',
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
}

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  tone?: StatTone
}

export function StatCard({ label, value, hint, tone = 'slate' }: StatCardProps) {
  return (
    <div className={`${cardClass} relative overflow-hidden p-4`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${accentClasses[tone]}`} aria-hidden="true" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
