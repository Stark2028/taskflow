import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/auth'
import { setUnauthorizedHandler, tokenStorage } from '../api/client'
import { FullPageSpinner } from '../components/Spinner'
import type { RegisterPayload, User } from '../types'
import { AuthContext, type AuthContextValue } from './useAuth'

/**
 * Auth flow:
 * 1. On load, if a token is stored, call GET /api/auth/me to find out who it belongs to.
 *    Until that resolves we render a full-page spinner, so guards never see a
 *    "half logged in" state.
 * 2. login() trades email + password for a JWT, stores it, then loads the user.
 * 3. logout() just forgets the token: JWTs are stateless, so there is nothing to
 *    tell the server. Route guards react to `user` becoming null.
 * 4. If any request returns 401 later (e.g. the token expired), the axios
 *    interceptor clears the token and calls our handler to reset state.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStorage.get())
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(() => tokenStorage.get() !== null)

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  useEffect(() => {
    if (!tokenStorage.get()) return

    let cancelled = false
    authApi
      .getMe()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => {
        // Invalid/expired token, or the API is unreachable: start logged out.
        if (!cancelled) clearSession()
      })
      .finally(() => {
        if (!cancelled) setInitializing(false)
      })

    return () => {
      cancelled = true
    }
  }, [clearSession])

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await authApi.login({ email, password })
    tokenStorage.set(access_token)
    try {
      const me = await authApi.getMe()
      setToken(access_token)
      setUser(me)
      return me
    } catch (error) {
      tokenStorage.clear()
      throw error
    }
  }, [])

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await authApi.register(payload)
      // Registration doesn't return a token, so log in with the same credentials.
      return login(payload.email, payload.password)
    },
    [login],
  )

  const refreshUser = useCallback(async () => {
    const me = await authApi.getMe()
    setUser(me)
    return me
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout: clearSession,
      refreshUser,
    }),
    [user, token, login, register, clearSession, refreshUser],
  )

  if (initializing) {
    return <FullPageSpinner label="Loading TaskFlow…" />
  }

  return <AuthContext value={value}>{children}</AuthContext>
}
