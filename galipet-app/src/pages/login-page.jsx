import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { UserContext } from '../UserContext.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useContext(UserContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleLoginSubmit(ev) {
    ev.preventDefault()
    setError('')
    const trimmedEmail = email.trim()
    setPending(true)
    try {
      const { data } = await api.post('/login', {
        email: trimmedEmail,
        password,
      })

      const { ok, user: sessionUser } = data ?? {}
      if (!ok || !sessionUser?.email) {
        setError('Unexpected response from server.')
        return
      }

      // Only the `user` object belongs in context — not `{ ok, user }`.
      setUser(sessionUser)
      const role = String(sessionUser.role || 'owner').toLowerCase()
      if (role === 'professional') {
        navigate('/pro/dashboard', { replace: true })
      } else if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/home', { replace: true })
      }
    } catch (e) {
      const msg =
        e?.response?.data?.error ??
        e?.message ??
        'Something went wrong. Try again.'
      setError(msg)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-4 flex grow items-center justify-center px-4 md:px-8">
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-center text-4xl">Login</h1>
        <form
          className="mx-auto flex w-full flex-col gap-2"
          onSubmit={handleLoginSubmit}
        >
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <input
            type="email"
            id="email"
            name="email"
            placeholder="your@email.com"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
          <input
            type="password"
            id="password"
            name="password"
            placeholder="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
          />
          <button
            type="submit"
            className="primary min-h-11 w-full"
            disabled={pending}
          >
            {pending ? 'Signing in…' : 'Login'}
          </button>
        </form>
        <div className="py-2 text-center text-gray-500">
          Don&apos;t have an account yet?{' '}
          <Link className="text-[#c2410c] underline" to="/register">
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}
