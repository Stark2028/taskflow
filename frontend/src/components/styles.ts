// Shared Tailwind class strings. Tailwind only generates classes it can find as
// complete strings in the source, so never build these by concatenating fragments.

import type { Role, TaskPriority, TaskStatus } from '../types'

export const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs ' +
  'placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ' +
  'aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:ring-rose-500/30'

export const cardClass = 'rounded-xl border border-slate-200 bg-white shadow-xs'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-outline' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-indigo-600',
  secondary:
    'border border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-50 focus-visible:outline-indigo-600',
  danger: 'bg-rose-600 text-white shadow-xs hover:bg-rose-500 focus-visible:outline-rose-600',
  'danger-outline':
    'border border-rose-200 bg-white text-rose-600 shadow-xs hover:bg-rose-50 focus-visible:outline-rose-600',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-indigo-600',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

/** Classes for a button, also usable on a <Link> that should look like one. */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]}`
}

export type BadgeTone = 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo'

export const badgeTones: Record<BadgeTone, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
}

export const statusTones: Record<TaskStatus, BadgeTone> = {
  TODO: 'slate',
  IN_PROGRESS: 'blue',
  COMPLETED: 'emerald',
}

export const priorityTones: Record<TaskPriority, BadgeTone> = {
  LOW: 'slate',
  MEDIUM: 'amber',
  HIGH: 'rose',
}

export const roleTones: Record<Role, BadgeTone> = {
  USER: 'slate',
  ADMIN: 'indigo',
}
