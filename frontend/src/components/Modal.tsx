import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { CloseIcon } from './Icons'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  size?: 'sm' | 'md'
}

/**
 * Accessible dialog: role="dialog" + aria-modal, labelled by its title, closes on
 * Escape or a backdrop click, locks page scroll, and returns focus to whatever was
 * focused before it opened. Rendered in a portal so it sits above the app shell.
 *
 * Put `data-autofocus` on the element that should receive focus when it opens.
 * (React's autoFocus would grab focus before we could record the previous element.)
 */
export function Modal({ open, title, onClose, children, size = 'md' }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEscapeKey(onClose, open)

  useEffect(() => {
    if (!open) return

    // Remember what had focus (usually the button that opened us) to restore it on close,
    // then move focus into the dialog: to an element marked data-autofocus, or the panel.
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const initialFocus = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel
    initialFocus?.focus()

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
      previouslyFocused?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="fixed inset-0 bg-slate-900/50" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-xl bg-white shadow-xl focus:outline-none ${
          size === 'sm' ? 'max-w-md' : 'max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
