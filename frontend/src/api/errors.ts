import axios from 'axios'

/** One entry of FastAPI's 422 response: {"detail": [{loc, msg, type}, ...]}. */
interface ValidationIssue {
  loc: (string | number)[]
  msg: string
  type: string
}

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.'

/** HTTP status of a failed request, or undefined for network/non-HTTP errors. */
export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}

/**
 * Turns any thrown value into a message that can be shown to the user.
 * Handles both FastAPI error shapes:
 *   - {"detail": "Some message"}            (most 4xx errors)
 *   - {"detail": [{loc, msg, type}, ...]}   (422 validation errors)
 */
export function getErrorMessage(error: unknown, fallback = DEFAULT_MESSAGE): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  if (!error.response) {
    return 'Could not reach the server. Check your connection and try again.'
  }

  const detail: unknown = (error.response.data as { detail?: unknown } | undefined)?.detail

  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return (detail as ValidationIssue[]).map(formatValidationIssue).join(' ')
  }

  if (error.response.status >= 500) {
    return 'The server ran into a problem. Please try again later.'
  }

  return fallback
}

// Locations that are not field names (e.g. a whole-body error has loc ["body"]).
const NON_FIELD_LOCATIONS = new Set(['body', 'query', 'path', 'header'])

function formatValidationIssue(issue: ValidationIssue): string {
  // Pydantic prefixes messages from custom validators with "Value error, ".
  const message = (issue.msg ?? 'Invalid value').replace(/^Value error,\s*/i, '')
  const field = issue.loc?.[issue.loc.length - 1]

  if (typeof field === 'string' && !NON_FIELD_LOCATIONS.has(field)) {
    return `${humanizeField(field)}: ${asSentence(message)}`
  }
  return asSentence(message)
}

function asSentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`
}

/** "full_name" -> "Full name" */
function humanizeField(field: string): string {
  const words = field.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
