import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { useAuth } from '../context/useAuth'
import { HomeIcon, ListIcon, LogoutIcon, ShieldIcon, UserIcon } from './Icons'
import { Logo } from './Logo'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <HomeIcon /> },
  { to: '/tasks', label: 'My Tasks', icon: <ListIcon /> },
  { to: '/profile', label: 'Profile', icon: <UserIcon /> },
  { to: '/admin', label: 'Admin', icon: <ShieldIcon />, adminOnly: true },
]

function initials(name: string): string {
  // Only words that start with a letter, so "Sameer (Admin)" gives "S", not "S(".
  return name
    .split(/\s+/)
    .filter((part) => /^\p{L}/u.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

interface SidebarProps {
  /** Called after a link is clicked (the mobile drawer uses it to close itself). */
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo />
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700"
              aria-hidden="true"
            >
              {initials(user.full_name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{user.full_name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            <LogoutIcon />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
