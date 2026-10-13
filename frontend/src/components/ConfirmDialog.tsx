import type { ReactNode } from 'react'
import { Button } from './Button'
import { ErrorAlert } from './ErrorAlert'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  /** "danger" for destructive actions such as deleting. */
  tone?: 'danger' | 'primary'
  loading?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Don't let Escape/backdrop close the dialog while the request is running.
  const handleClose = () => {
    if (!loading) onCancel()
  }

  return (
    <Modal open={open} title={title} onClose={handleClose} size="sm">
      <div className="space-y-4">
        <div className="text-sm text-slate-600">{message}</div>
        {error && <ErrorAlert message={error} />}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={handleClose} disabled={loading} data-autofocus>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
