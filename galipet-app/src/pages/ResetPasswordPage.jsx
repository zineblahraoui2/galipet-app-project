import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => String(searchParams.get('token') || '').trim(), [searchParams])

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Link expired or invalid')
    }
  }, [token])

  async function handleSubmit(ev) {
    ev.preventDefault()
    setError('')
    if (!token) {
      setError('Link expired or invalid')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setPending(true)
    try {
      const { data } = await api.post('/api/auth/reset-password', {
        token,
        newPassword: password,
      })
      if (data?.ok) {
        setSuccess(true)
        window.setTimeout(() => {
          navigate('/login', { replace: true })
        }, 2000)
      } else {
        setError('Link expired or invalid')
      }
    } catch (e) {
      const serverMsg = e?.response?.data?.error
      if (serverMsg && String(serverMsg).toLowerCase().includes('invalid')) {
        setError('Link expired or invalid')
      } else {
        setError(serverMsg || 'Link expired or invalid')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-4 flex grow items-center justify-center px-4 md:px-8">
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-center text-4xl">Reset password</h1>
        {!token ? (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            Link expired or invalid
          </p>
        ) : null}
        <form className="mx-auto flex w-full flex-col gap-2" onSubmit={handleSubmit}>
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-center text-sm text-green-800">
              Password updated. Redirecting to login…
            </p>
          ) : null}
          <input
            type="password"
            id="reset-password"
            name="password"
            placeholder="New password"
            autoComplete="new-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            disabled={pending || success || !token}
          />
          <input
            type="password"
            id="reset-password-confirm"
            name="confirmPassword"
            placeholder="Confirm new password"
            autoComplete="new-password"
            value={confirm}
            onChange={(ev) => setConfirm(ev.target.value)}
            disabled={pending || success || !token}
          />
          <button
            type="submit"
            className="primary min-h-11 w-full"
            disabled={pending || success || !token}
          >
            {pending ? 'Updating…' : 'Update password'}
          </button>
        </form>
        <div className="py-4 text-center text-sm text-gray-500">
          <Link className="text-[#c2410c] underline" to="/login">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
