// Client-side checks mirror the API's rules so users get instant feedback.
// The server validates everything again; these are a convenience, not security.

/** Deliberately loose: "something@something.something". The server has the final say. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128
export const FULL_NAME_MAX = 100

/** Returns an error message, or undefined if the password length is acceptable. */
export function validatePassword(password: string, label = 'Password'): string | undefined {
  if (!password) return `${label} is required.`
  if (password.length < PASSWORD_MIN) return `${label} must be at least ${PASSWORD_MIN} characters.`
  if (password.length > PASSWORD_MAX) return `${label} must be at most ${PASSWORD_MAX} characters.`
  return undefined
}

export function validateFullName(fullName: string): string | undefined {
  const trimmed = fullName.trim()
  if (!trimmed) return 'Full name is required.'
  if (trimmed.length > FULL_NAME_MAX) return `Full name must be at most ${FULL_NAME_MAX} characters.`
  return undefined
}

/** True if any field in a `{ field: message | undefined }` object has an error. */
export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean)
}
