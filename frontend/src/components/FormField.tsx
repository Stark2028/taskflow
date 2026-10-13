import type { InputHTMLAttributes, ReactNode } from 'react'
import { inputClass } from './styles'

interface FormFieldProps {
  /** id of the control inside; used for the label and the error/hint ids. */
  id: string
  label: string
  error?: string
  hint?: ReactNode
  children: ReactNode
}

/** Label + control + error (or hint) message. Use for selects/textareas. */
export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-rose-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

/** aria props that tie a control to the message rendered by <FormField>. */
function describedBy(id: string, error?: string, hasHint = false) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  }
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string
  label: string
  error?: string
  hint?: ReactNode
}

/** A labelled <input> with an optional error or hint message. */
export function TextField({ id, label, error, hint, className = '', ...inputProps }: TextFieldProps) {
  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        className={`${inputClass} ${className}`}
        {...describedBy(id, error, Boolean(hint))}
        {...inputProps}
      />
    </FormField>
  )
}
