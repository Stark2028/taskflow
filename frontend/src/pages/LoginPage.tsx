import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { getErrorMessage } from '../api/errors'
import { AuthCard } from '../components/AuthCard'
import { Button } from '../components/Button'
import { ErrorAlert } from '../components/ErrorAlert'
import { TextField } from '../components/FormField'
import { useAuth } from '../context/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { EMAIL_PATTERN, hasErrors } from '../utils/validation'

interface FieldErrors {
  email?: string
  password?: string
}

export function LoginPage() {
  useDocumentTitle('Log in')
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): FieldErrors {
    const result: FieldErrors = {}
    if (!email.trim()) result.email = 'Email is required.'
    else if (!EMAIL_PATTERN.test(email.trim())) result.email = 'Enter a valid email address.'
    if (!password) result.password = 'Password is required.'
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
      await login(email.trim(), password)
      // No navigate() here: once `user` is set, <GuestRoute> redirects to the
      // page the user originally asked for (or the dashboard).
    } catch (error) {
      setSubmitError(getErrorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Log in to TaskFlow"
      subtitle="Welcome back! Enter your details to continue."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {submitError && <ErrorAlert message={submitError} />}
        <TextField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          autoFocus
          required
        />
        <TextField
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          required
        />
        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthCard>
  )
}
