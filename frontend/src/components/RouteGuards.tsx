import { Navigate, Outlet, useLocation, type Location } from 'react-router'
import { useAuth } from '../context/useAuth'

// These guards only shape the UX (what the user is shown). Real authorization is
// enforced by the backend on every request, so bypassing them achieves nothing.

/** What <ProtectedRoute> puts in location.state when it redirects to /login. */
interface RedirectState {
  from?: Location
}

/** Only for logged-in users; otherwise go to /login and remember where they were headed. */
export function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location } satisfies RedirectState} />
  }
  return <Outlet />
}

/** Only for admins; everyone else is sent to the dashboard. Nest inside <ProtectedRoute>. */
export function AdminRoute() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}

/**
 * For /login and /register. Once the user is logged in (including right after a
 * successful login/register) send them to the page they originally wanted, or home.
 * This is the single place that performs the post-login redirect.
 */
export function GuestRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (user) {
    const from = (location.state as RedirectState | null)?.from
    return <Navigate to={from ?? '/'} replace />
  }
  return <Outlet />
}
