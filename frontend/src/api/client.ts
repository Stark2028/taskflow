import axios from 'axios'

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

export const LOGIN_PATH = '/api/auth/login'

const TOKEN_KEY = 'taskflow.token'

/**
 * The JWT lives in localStorage so the session survives page reloads.
 * Trade-off: any script running on the page (e.g. via an XSS bug) can read it,
 * unlike an httpOnly cookie. See the project README for the discussion.
 */
export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/** The single axios instance every API module uses. */
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the token (if any) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// The interceptor lives outside React, so AuthProvider registers a callback here
// that resets its state. Clearing the user makes <ProtectedRoute> redirect to /login.
let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

// A 401 means the token is missing, invalid or expired: drop it and log the user out.
// The login endpoint is excluded because its 401 just means "wrong email or password".
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.url !== LOGIN_PATH
    ) {
      tokenStorage.clear()
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  },
)

/** Drops undefined, null and empty-string values so they are not sent as query params. */
export function compactParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Partial<T>
}
