import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(ev) {
    ev.preventDefault()
    setError('')
    setSuccess(false)
    setPending(true)
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email: email.trim() })
      if (data?.ok) {
        setSuccess(true)
      } else {
        setError('Something went wrong. Try again.')
      }
    } catch (e) {
      const msg =
        e?.response?.data?.error ?? e?.message ?? 'Something went wrong. Try again.'
      setError(msg)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-4 flex grow items-center justify-center px-4 md:px-8">
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-center text-4xl">Forgot password</h1>
        <p className="mb-4 text-center text-sm text-gray-600">
          Enter your email and we&apos;ll send you a reset link if an account exists.
        </p>
        <form className="mx-auto flex w-full flex-col gap-2" onSubmit={handleSubmit}>
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-center text-sm text-green-800">
              Check your email for a reset link
            </p>
          ) : null}
          <input
            type="email"
            id="forgot-email"
            name="email"
            placeholder="your@email.com"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            disabled={pending}
          />
          <button type="submit" className="primary min-h-11 w-full" disabled={pending}>
            {pending ? 'Sending…' : 'Send reset link'}
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
