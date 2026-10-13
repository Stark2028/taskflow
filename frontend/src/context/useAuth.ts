import { createContext, useContext } from 'react'
import type { RegisterPayload, User } from '../types'

export interface AuthContextValue {
  /** The logged-in user, or null when logged out. */
  user: User | null
  /** The raw JWT, or null when logged out. */
  token: string | null
  isAdmin: boolean
  login: (email: string, password: string) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => void
  /** Re-fetch the current user, e.g. after editing the profile. */
  refreshUser: () => Promise<User>
}

// The context object and hook live here rather than in AuthContext.tsx so that
// file only exports a component, which React Fast Refresh requires.
export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}
