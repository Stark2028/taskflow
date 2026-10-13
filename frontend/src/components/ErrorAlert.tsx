import { Button } from './Button'
import { AlertIcon } from './Icons'

interface ErrorAlertProps {
  message: string
  title?: string
  onRetry?: () => void
  onDismiss?: () => void
}

export function ErrorAlert({ message, title, onRetry, onDismiss }: ErrorAlertProps) {
  return (
    <div role="alert" className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
      <AlertIcon className="mt-0.5 size-5 shrink-0 text-rose-500" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        <p className="break-words">{message}</p>
      </div>
      {(onRetry || onDismiss) && (
        <div className="flex shrink-0 items-start gap-2">
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function SuccessAlert({ message }: { message: string }) {
  return (
    <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
      {message}
    </div>
  )
}
