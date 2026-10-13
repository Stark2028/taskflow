import { useCallback, useEffect, useRef } from 'react'

/**
 * Returns a debounced version of `callback`: calling it (re)starts a timer and the
 * real callback only runs once calls stop for `delay` ms. Used for search boxes so
 * we send one request after the user stops typing instead of one per keystroke.
 *
 * The latest `callback` is kept in a ref, so the returned function stays stable
 * across renders (and the pending timer isn't reset) even if `callback` changes.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
) {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Don't fire after the component has unmounted.
  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  return useCallback(
    (...args: Args) => {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => callbackRef.current(...args), delay)
    },
    [delay],
  )
}
