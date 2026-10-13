import { useState } from 'react'
import { Outlet } from 'react-router'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { CloseIcon, MenuIcon } from './Icons'
import { Logo } from './Logo'
import { Sidebar } from './Sidebar'

/** App shell: fixed sidebar on md+ screens, top bar + slide-over drawer on mobile. */
export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = () => setDrawerOpen(false)

  useEscapeKey(closeDrawer, drawerOpen)

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white md:block">
        <Sidebar />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          aria-controls="mobile-navigation"
          className="-ml-1 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          <MenuIcon className="size-6" />
        </button>
        <Logo />
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50" aria-hidden="true" onClick={closeDrawer} />
          <div
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-xl"
          >
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close navigation"
              autoFocus
              className="absolute top-4 right-3 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              <CloseIcon />
            </button>
            <Sidebar onNavigate={closeDrawer} />
          </div>
        </div>
      )}

      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
