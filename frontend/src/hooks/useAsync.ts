import { useCallback, useEffect, useState } from 'react'

type Fetcher<T> = (signal: AbortSignal) => Promise<T>

interface Settled<T> {
  data: T | null
  error: unknown
  /** Which request produced this result, so we can tell whether it's current. */
  fetcher: Fetcher<T> | null
  reloadCount: number
}

/**
 * Runs `fetcher` on mount and whenever it changes (wrap it in useCallback with
 * the values it depends on), and returns { data, error, loading, reload, setData }.
 *
 * - Previous data is kept while a new request is in flight, so tables don't flash.
 * - When the inputs change mid-request, the old request is aborted and its result
 *   ignored, so a slow stale response can never overwrite a newer one.
 * - `loading` is derived rather than stored: we're loading whenever the last settled
 *   result came from a different request than the current one.
 */
export function useAsync<T>(fetcher: Fetcher<T>) {
  const [reloadCount, setReloadCount] = useState(0)
  const [settled, setSettled] = useState<Settled<T>>({
    data: null,
    error: null,
    fetcher: null,
    reloadCount: -1,
  })

  useEffect(() => {
    const controller = new AbortController()

    fetcher(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSettled({ data, error: null, fetcher, reloadCount })
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setSettled((prev) => ({ ...prev, error, fetcher, reloadCount }))
      },
    )

    return () => controller.abort()
  }, [fetcher, reloadCount])

  const loading = settled.fetcher !== fetcher || settled.reloadCount !== reloadCount

  /** Fetch again with the same inputs (e.g. after creating or deleting something). */
  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  /** Update the cached data locally, e.g. with the object a PATCH returned. */
  const setData = useCallback((update: (prev: T | null) => T | null) => {
    setSettled((prev) => ({ ...prev, data: update(prev.data) }))
  }, [])

  return {
    data: settled.data,
    // Hide the previous error while retrying.
    error: loading ? null : settled.error,
    loading,
    reload,
    setData,
  }
}
