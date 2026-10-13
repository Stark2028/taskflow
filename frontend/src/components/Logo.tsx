import { CheckIcon } from './Icons'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <CheckIcon className="size-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">TaskFlow</span>
    </span>
  )
}
