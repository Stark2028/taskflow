// Date helpers. The API speaks ISO 8601 (UTC or with an offset); the UI shows local time.

// en-GB gives "13 Oct 2026, 6:30 pm". Change the locale here to adjust formatting app-wide.
const LOCALE = 'en-GB'

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })

/** "13 Oct 2026, 6:30 pm" */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

/** "13 Oct 2026" */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}

/** "in 3 days", "2 hours ago", "tomorrow"… relative to now. */
export function formatRelative(iso: string, now = Date.now()): string {
  const diffSeconds = (new Date(iso).getTime() - now) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ]
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return relativeFormat.format(Math.round(diffSeconds / secondsInUnit), unit)
    }
  }
  return relativeFormat.format(Math.round(diffSeconds / 60), 'minute')
}

/**
 * ISO string -> value for <input type="datetime-local"> ("YYYY-MM-DDTHH:mm" in local time).
 * We can't use toISOString() here because that would show the UTC time.
 */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/**
 * datetime-local value -> ISO string in UTC (e.g. "2026-10-13T13:00:00.000Z"), or null if empty.
 * `new Date("YYYY-MM-DDTHH:mm")` (no offset) is parsed as *local* time, which is what the user meant.
 */
export function localInputToIso(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
