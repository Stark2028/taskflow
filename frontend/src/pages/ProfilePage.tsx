import { useState, type FormEvent } from 'react'
import { authApi } from '../api/auth'
import { getErrorMessage } from '../api/errors'
import { RoleBadge } from '../components/Badges'
import { Button } from '../components/Button'
import { ErrorAlert, SuccessAlert } from '../components/ErrorAlert'
import { TextField } from '../components/FormField'
import { PageHeader } from '../components/PageHeader'
import { cardClass } from '../components/styles'
import { useAuth } from '../context/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { User } from '../types'
import { formatDate } from '../utils/dates'
import {
  FULL_NAME_MAX,
  hasErrors,
  PASSWORD_MAX,
  PASSWORD_MIN,
  validateFullName,
  validatePassword,
} from '../utils/validation'

export function ProfilePage() {
  useDocumentTitle('Profile')
  const { user } = useAuth()

  // ProtectedRoute guarantees a user here; this keeps TypeScript happy.
  if (!user) return null

  return (
    <>
      <PageHeader title="Profile" description="Manage your account details and password." />
      <div className="grid gap-6 lg:grid-cols-3">
        <AccountCard user={user} />
        <div className="space-y-6 lg:col-span-2">
          <ProfileForm user={user} />
          <PasswordForm />
        </div>
      </div>
    </>
  )
}

function AccountCard({ user }: { user: User }) {
  return (
    <section aria-labelledby="account-heading" className={`${cardClass} h-fit p-6`}>
      <h2 id="account-heading" className="text-base font-semibold text-slate-900">
        Account
      </h2>
      <dl className="mt-4 space-y-4 text-sm">
        <div>
          <dt className="text-slate-500">Name</dt>
          <dd className="mt-0.5 font-medium break-words text-slate-900">{user.full_name}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Email</dt>
          <dd className="mt-0.5 font-medium break-all text-slate-900">{user.email}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Role</dt>
          <dd className="mt-1">
            <RoleBadge role={user.role} />
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Member since</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{formatDate(user.created_at)}</dd>
        </div>
      </dl>
    </section>
  )
}

function ProfileForm({ user }: { user: User }) {
  const { refreshUser } = useAuth()
  const [fullName, setFullName] = useState(user.full_name)
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const unchanged = fullName.trim() === user.full_name

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const error = validateFullName(fullName)
    setFieldError(error)
    setSuccess(false)
    if (error || unchanged) return

    setSaving(true)
    setSubmitError(null)
    try {
      await authApi.updateMe({ full_name: fullName.trim() })
      // Reload the user in AuthContext so the sidebar shows the new name too.
      const updated = await refreshUser()
      setFullName(updated.full_name)
      setSuccess(true)
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby="profile-heading" className={`${cardClass} p-6`}>
      <h2 id="profile-heading" className="text-base font-semibold text-slate-900">
        Personal information
      </h2>
      <p className="mt-1 text-sm text-slate-500">Your email address can&apos;t be changed.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        {submitError && <ErrorAlert message={submitError} />}
        {success && <SuccessAlert message="Your profile has been updated." />}
        <TextField
          id="profile-full-name"
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value)
            setSuccess(false)
          }}
          error={fieldError}
          maxLength={FULL_NAME_MAX}
          required
        />
        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={unchanged}>
            Save changes
          </Button>
        </div>
      </form>
    </section>
  )
}

interface PasswordErrors {
  current?: string
  next?: string
  confirm?: string
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<PasswordErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  function validate(): PasswordErrors {
    const result: PasswordErrors = {}
    if (!currentPassword) result.current = 'Current password is required.'
    result.next = validatePassword(newPassword, 'New password')
    if (!result.next && newPassword === currentPassword) {
      result.next = 'New password must be different from the current one.'
    }
    if (!confirmPassword) result.confirm = 'Please confirm the new password.'
    else if (confirmPassword !== newPassword) result.confirm = "Passwords don't match."
    return result
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fieldErrors = validate()
    setErrors(fieldErrors)
    setSuccess(false)
    if (hasErrors(fieldErrors)) return

    setSaving(true)
    setSubmitError(null)
    try {
      await authApi.updateMe({ current_password: currentPassword, new_password: newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess(true)
    } catch (err) {
      // e.g. 400 when the current password is wrong
      setSubmitError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby="password-heading" className={`${cardClass} p-6`}>
      <h2 id="password-heading" className="text-base font-semibold text-slate-900">
        Change password
      </h2>
      <p className="mt-1 text-sm text-slate-500">Enter your current password to choose a new one.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        {submitError && <ErrorAlert message={submitError} />}
        {success && <SuccessAlert message="Your password has been changed." />}
        <TextField
          id="current-password"
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          error={errors.current}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            error={errors.next}
            hint={`${PASSWORD_MIN}–${PASSWORD_MAX} characters.`}
            maxLength={PASSWORD_MAX}
            required
          />
          <TextField
            id="confirm-password"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={errors.confirm}
            maxLength={PASSWORD_MAX}
            required
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Update password
          </Button>
        </div>
      </form>
    </section>
  )
}
