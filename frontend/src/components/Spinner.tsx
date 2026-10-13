export function Spinner({ className = 'size-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** Centered spinner for a section of a page that is loading. */
export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
      <Spinner className="size-5 text-indigo-600" />
      <span>{label}</span>
    </div>
  )
}

/** Covers the whole viewport, used while the app works out who is logged in. */
export function FullPageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="size-8 text-indigo-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
