import { useState } from 'react'
import { getErrorMessage } from '../../api/errors'
import { tasksApi } from '../../api/tasks'
import type { Task } from '../../types'
import { ConfirmDialog } from '../ConfirmDialog'

interface DeleteTaskDialogProps {
  /** The task to delete; the dialog is open while this is non-null. */
  task: Task | null
  onClose: () => void
  onDeleted: (task: Task) => void
}

/** "Delete this task?" confirmation that performs the DELETE request itself. */
export function DeleteTaskDialog({ task, onClose, onDeleted }: DeleteTaskDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!task) return
    setDeleting(true)
    setError(null)
    try {
      await tasksApi.remove(task.id)
      onDeleted(task)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  function handleCancel() {
    setError(null)
    onClose()
  }

  return (
    <ConfirmDialog
      open={task !== null}
      title="Delete task?"
      message={
        <>
          <span className="font-medium text-slate-900">“{task?.title}”</span> will be permanently deleted.
          This can&apos;t be undone.
        </>
      }
      confirmLabel="Delete task"
      loading={deleting}
      error={error}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )
}
