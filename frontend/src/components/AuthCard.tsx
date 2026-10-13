import type { ReactNode } from 'react'
import { Logo } from './Logo'
import { cardClass } from './styles'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/** Centered card layout shared by the login and register pages. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Logo className="mb-8" />
      <div className={`${cardClass} w-full max-w-md p-6 sm:p-8`}>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-sm text-slate-600">{footer}</div>}
    </main>
  )
}
