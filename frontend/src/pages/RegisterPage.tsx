import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { getErrorMessage } from '../api/errors'
import { AuthCard } from '../components/AuthCard'
import { Button } from '../components/Button'
import { ErrorAlert } from '../components/ErrorAlert'
import { TextField } from '../components/FormField'
import { useAuth } from '../context/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import {
  EMAIL_PATTERN,
  FULL_NAME_MAX,
  hasErrors,
  PASSWORD_MAX,
  PASSWORD_MIN,
  validateFullName,
  validatePassword,
} from '../utils/validation'

interface FieldErrors {
  fullName?: string
  email?: string
  password?: string
}

export function RegisterPage() {
  useDocumentTitle('Create account')
  const { register } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): FieldErrors {
    const result: FieldErrors = {}
    result.fullName = validateFullName(fullName)
    if (!email.trim()) result.email = 'Email is required.'
    else if (!EMAIL_PATTERN.test(email.trim())) result.email = 'Enter a valid email address.'
    result.password = validatePassword(password)
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
      // Creates the account, then logs in; <GuestRoute> then redirects to the dashboard.
      await register({ full_name: fullName.trim(), email: email.trim(), password })
    } catch (error) {
      setSubmitError(getErrorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start organising your work in a couple of seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {submitError && <ErrorAlert message={submitError} />}
        <TextField
          id="register-name"
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={errors.fullName}
          maxLength={FULL_NAME_MAX}
          autoFocus
          required
        />
        <TextField
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          required
        />
        <TextField
          id="register-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          hint={`${PASSWORD_MIN}–${PASSWORD_MAX} characters.`}
          maxLength={PASSWORD_MAX}
          required
        />
        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  )
}
