import { tasksApi } from '../../api/tasks'
import type { Task, TaskPayload } from '../../types'
import { Modal } from '../Modal'
import { TaskForm } from './TaskForm'

interface TaskFormModalProps {
  open: boolean
  /** Pass a task to edit it; leave null/undefined to create a new one. */
  task?: Task | null
  onClose: () => void
  onSaved: (task: Task) => void
}

/** "New task" / "Edit task" dialog. Talks to the API itself and reports the saved task. */
export function TaskFormModal({ open, task, onClose, onSaved }: TaskFormModalProps) {
  const isEditing = Boolean(task)

  async function handleSubmit(values: TaskPayload) {
    // PUT needs every field, which TaskForm always provides; POST accepts the same body.
    const saved = task ? await tasksApi.update(task.id, values) : await tasksApi.create(values)
    onSaved(saved)
  }

  return (
    <Modal open={open} title={isEditing ? 'Edit task' : 'New task'} onClose={onClose}>
      {/* The Modal unmounts its content when closed, so the form starts fresh each time. */}
      <TaskForm
        initialTask={task}
        submitLabel={isEditing ? 'Save changes' : 'Create task'}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  )
}
