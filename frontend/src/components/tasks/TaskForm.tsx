import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../../api/errors'
import type { Task, TaskPayload, TaskPriority, TaskStatus } from '../../types'
import { isoToLocalInput, localInputToIso } from '../../utils/dates'
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../../utils/taskMeta'
import { hasErrors } from '../../utils/validation'
import { Button } from '../Button'
import { ErrorAlert } from '../ErrorAlert'
import { FormField, TextField } from '../FormField'
import { inputClass } from '../styles'

const TITLE_MAX = 200
const DESCRIPTION_MAX = 2000

interface TaskFormProps {
  /** The task being edited, or undefined/null to create a new one. */
  initialTask?: Task | null
  submitLabel: string
  /** Should throw on failure; the form shows the error message. */
  onSubmit: (values: TaskPayload) => Promise<void>
  onCancel: () => void
}

interface FieldErrors {
  title?: string
  description?: string
}

export function TaskForm({ initialTask, submitLabel, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title ?? '')
  const [description, setDescription] = useState(initialTask?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status ?? 'TODO')
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority ?? 'MEDIUM')
  // Kept in the datetime-local format ("YYYY-MM-DDTHH:mm", local time) while editing.
  const [dueDate, setDueDate] = useState(isoToLocalInput(initialTask?.due_date ?? null))

  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): FieldErrors {
    const result: FieldErrors = {}
    if (!title.trim()) result.title = 'Title is required.'
    else if (title.trim().length > TITLE_MAX) result.title = `Title must be at most ${TITLE_MAX} characters.`
    if (description.length > DESCRIPTION_MAX) {
      result.description = `Description must be at most ${DESCRIPTION_MAX} characters.`
    }
    return result
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fieldErrors = validate()
    setErrors(fieldErrors)
    if (hasErrors(fieldErrors)) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() ? description : null,
        status,
        priority,
        due_date: localInputToIso(dueDate),
      })
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {submitError && <ErrorAlert message={submitError} />}

      <TextField
        id="task-title"
        label="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        error={errors.title}
        maxLength={TITLE_MAX}
        required
        data-autofocus
        placeholder="e.g. Prepare sprint demo"
      />

      <FormField
        id="task-description"
        label="Description (optional)"
        error={errors.description}
        hint={`${description.length}/${DESCRIPTION_MAX} characters`}
      >
        <textarea
          id="task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          maxLength={DESCRIPTION_MAX}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? 'task-description-error' : 'task-description-hint'}
          className={`${inputClass} resize-y`}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="task-status" label="Status">
          <select
            id="task-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
            className={inputClass}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="task-priority" label="Priority">
          <select
            id="task-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className={inputClass}
          >
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField id="task-due-date" label="Due date (optional)" hint="Shown in your local time zone.">
        <div className="flex gap-2">
          <input
            id="task-due-date"
            type="datetime-local"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            aria-describedby="task-due-date-hint"
            className={inputClass}
          />
          {dueDate && (
            <Button variant="secondary" onClick={() => setDueDate('')}>
              Clear
            </Button>
          )}
        </div>
      </FormField>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
