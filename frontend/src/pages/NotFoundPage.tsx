import { Link } from 'react-router'
import { Logo } from '../components/Logo'
import { buttonClass } from '../components/styles'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-10" />
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-slate-500">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or never existed.
      </p>
      <Link to="/" className={`${buttonClass('primary')} mt-8`}>
        Back to dashboard
      </Link>
    </main>
  )
}
