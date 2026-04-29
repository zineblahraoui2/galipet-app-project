import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { getApiOrigin } from '../lib/apiOrigin.js'
import { UserContext } from '../UserContext.jsx'

const googleIcon = (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
    <path
      fill="#4285F4"
      d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
    />
    <path
      fill="#34A853"
      d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
    />
    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z" />
    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
  </svg>
)

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setUser } = useContext(UserContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [oauthCode, setOauthCode] = useState(null)

  useEffect(() => {
    const e = searchParams.get('error')
    if (!e) return
    setOauthCode(e)
    navigate('/login', { replace: true })
  }, [searchParams, navigate])

  const oauthErrorMessage = useMemo(() => {
    if (oauthCode === 'google_failed') {
      return 'La connexion Google a échoué. Veuillez réessayer.'
    }
    if (oauthCode === 'suspended') {
      return 'Ce compte est suspendu. Contactez le support.'
    }
    if (oauthCode === 'google_not_configured') {
      return 'La connexion Google n’est pas configurée sur le serveur.'
    }
    return ''
  }, [oauthCode])

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
          {oauthErrorMessage ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
              {oauthErrorMessage}
            </p>
          ) : null}
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
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-xs text-gray-500 underline-offset-2 hover:text-gray-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            className="primary min-h-11 w-full"
            disabled={pending}
          >
            {pending ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = `${getApiOrigin()}/api/auth/google`
          }}
          className="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#D85A30]/40 hover:bg-gray-50"
        >
          {googleIcon}
          Continuer avec Google
        </button>

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
