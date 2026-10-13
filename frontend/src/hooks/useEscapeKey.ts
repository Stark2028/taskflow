import { useEffect, useRef } from 'react'

/** Calls `onEscape` when the Escape key is pressed, while `active` is true. */
export function useEscapeKey(onEscape: () => void, active = true) {
  // A ref lets the listener always call the latest callback without re-subscribing.
  const handlerRef = useRef(onEscape)

  useEffect(() => {
    handlerRef.current = onEscape
  }, [onEscape])

  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handlerRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [active])
}
