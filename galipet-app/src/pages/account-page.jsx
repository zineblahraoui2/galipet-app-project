import { useContext, useEffect, useState } from 'react'
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { FaPaw, FaStar } from 'react-icons/fa'
import { Check, Lock } from 'lucide-react'
import { UserContext } from '../UserContext.jsx'
import { api } from '../api/client.js'
import MyPetsTab from '../components/tabs/MyPetsTab.jsx'
import BookingsTab from '../components/tabs/BookingsTab.jsx'
import ActivityTab from '../components/tabs/ActivityTab.jsx'
import ReviewList from '../components/reviews/ReviewList.jsx'

const accountSections = [
  { to: '/account', label: 'My profile', end: true, withUserIcon: true },
  { to: '/account/pets', label: 'My pets', withPawIcon: true },
  { to: '/account/bookings', label: 'Bookings', withBookingsIcon: true },
  { to: '/account/reviews', label: 'My reviews', withReviewsIcon: true },
  { to: '/account/activity', label: 'Activity', withActivityIcon: true },
  { to: '/account/notifications', label: 'Notifications', withNotificationsIcon: true },
  { to: '/account/subscription', label: 'Subscription' },
]

function navLinkClass({ isActive }) {
  return [
    'inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-[#E05C2A] text-white shadow-sm'
      : 'border border-[#E05C2A] bg-white text-[#E05C2A] shadow-sm hover:bg-[#FEE9DF]',
  ].join(' ')
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  )
}

function BookingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  )
}

function NotificationsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  )
}

function AccountPlaceholder({ title }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
      <p className="font-medium text-gray-800">{title}</p>
      <p className="mt-2 text-sm">Coming soon.</p>
    </div>
  )
}

/** Shell: auth gate + sub-nav + child route (`Outlet`). Routes are declared in `App.jsx`. */
export default function AccountLayout() {
  const location = useLocation()
  const { user, ready } = useContext(UserContext)

  if (!ready) {
    return (
      <p className="mt-8 text-center text-sm text-gray-500">Loading…</p>
    )
  }

  // Only when someone opens /account… without a session (not during logout navigation away).
  if (ready && !user && location.pathname.startsWith('/account')) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 md:px-8">
      <nav
        className="mt-6 flex flex-wrap justify-center gap-2"
        aria-label="Account sections"
      >
        {accountSections.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            end={section.end}
            className={navLinkClass}
          >
            {section.withUserIcon ? <UserIcon /> : null}
            {section.withPawIcon ? <FaPaw className="h-5 w-5" /> : null}
            {section.withBookingsIcon ? <BookingsIcon /> : null}
            {section.withReviewsIcon ? <FaStar className="h-4 w-4 shrink-0 text-[#E05C2A]" aria-hidden /> : null}
            {section.withActivityIcon ? <ActivityIcon /> : null}
            {section.withNotificationsIcon ? <NotificationsIcon /> : null}
            <span>{section.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>

      <Link
        className="mt-8 inline-block text-sm font-medium text-[#D85A30] underline"
        to="/"
      >
        Back to home
      </Link>
    </div>
  )
}

export function AccountProfileTab() {
  const navigate = useNavigate()
  const { user, setUser, logout } = useContext(UserContext)
  const [busy, setBusy] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    email: '',
    avatar: '',
    plan: 'free',
    createdAt: '',
    hasGoogleLogin: false,
  })
  const [pwdCurrent, setPwdCurrent] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdBusy, setPwdBusy] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdErr, setPwdErr] = useState('')

  // Intentionally mount-only: never depend on `user`, `form`, or anything updated by this fetch,
  // or `setUser` will retrigger and hammer `/api/users/me` (infinite loop).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingProfile(true)
      setError('')
      try {
        const { data } = await api.get('/api/users/me', {
          params: { t: Date.now() },
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        })
        const userData = data?.user
        if (!cancelled && userData?.email) {
          setForm({
            firstName: userData.firstName ?? '',
            lastName: userData.lastName ?? '',
            phone: userData.phone ?? '',
            country: userData.country ?? '',
            city: userData.city ?? '',
            address: userData.address ?? '',
            email: userData.email ?? '',
            avatar: userData.avatar ?? '',
            plan: userData.plan ?? 'free',
            createdAt: userData.createdAt ?? '',
            hasGoogleLogin: Boolean(userData.hasGoogleLogin),
          })
          setUser((prev) => ({
            ...(prev ?? {}),
            ...userData,
            name:
              `${userData.firstName ?? ''} ${userData.lastName ?? ''}`.trim() ||
              userData.name ||
              '',
          }))
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.error ?? 'Failed to load your profile.')
        }
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load profile once per tab mount only
  }, [])

  function initials() {
    const first = form.firstName?.trim()?.[0] ?? ''
    const last = form.lastName?.trim()?.[0] ?? ''
    const computed = `${first}${last}`.toUpperCase()
    if (computed) return computed
    return form.email?.trim()?.[0]?.toUpperCase() || '?'
  }

  function memberSinceLabel() {
    if (!form.createdAt) return '—'
    const date = new Date(form.createdAt)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  function avatarSrc() {
    if (!form.avatar) return ''
    if (/^https?:\/\//i.test(form.avatar)) return form.avatar
    return `${api.defaults.baseURL}${form.avatar}`
  }

  async function handleLogout() {
    setBusy(true)
    try {
      localStorage.removeItem('token')
      await logout()
      navigate('/', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  function updateField(field) {
    return (ev) => {
      const value = ev.target.value
      setForm((prev) => ({ ...prev, [field]: value }))
    }
  }

  async function handleSave(ev) {
    ev.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        country: form.country,
        city: form.city,
        address: form.address,
      }
      const { data } = await api.patch('/api/users/me', payload)
      const userData = data?.user
      if (userData?.email) {
        setForm((prev) => ({
          ...prev,
          firstName: userData.firstName ?? '',
          lastName: userData.lastName ?? '',
          phone: userData.phone ?? '',
          country: userData.country ?? '',
          city: userData.city ?? '',
          address: userData.address ?? '',
          email: userData.email ?? prev.email,
          avatar: userData.avatar ?? prev.avatar,
          plan: userData.plan ?? prev.plan,
          createdAt: userData.createdAt ?? prev.createdAt,
          hasGoogleLogin: Boolean(userData.hasGoogleLogin ?? prev.hasGoogleLogin),
        }))
        setUser((prev) => ({
          ...(prev ?? {}),
          ...userData,
          name:
            `${userData.firstName ?? ''} ${userData.lastName ?? ''}`.trim() ||
            userData.name ||
            '',
        }))
      }
      setToast('Profile saved successfully.')
      window.setTimeout(() => setToast(''), 2500)
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to save your profile.')
    } finally {
      setBusy(false)
    }
  }

  async function handlePasswordUpdate(ev) {
    ev.preventDefault()
    setPwdErr('')
    setPwdMsg('')
    if (form.hasGoogleLogin) return
    if (pwdNew.length < 8) {
      setPwdErr('New password must be at least 8 characters.')
      return
    }
    if (pwdNew !== pwdConfirm) {
      setPwdErr('New passwords do not match.')
      return
    }
    setPwdBusy(true)
    try {
      await api.patch('/api/users/me/password', {
        currentPassword: pwdCurrent,
        newPassword: pwdNew,
      })
      setPwdCurrent('')
      setPwdNew('')
      setPwdConfirm('')
      setPwdMsg('Password updated.')
      window.setTimeout(() => setPwdMsg(''), 3000)
    } catch (e) {
      setPwdErr(e?.response?.data?.error ?? 'Could not update password.')
    } finally {
      setPwdBusy(false)
    }
  }

  async function handleAvatarUpload(ev) {
    const file = ev.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('avatar', file)
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post('/api/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const userData = data?.user
      if (userData?.avatar != null) {
        setForm((prev) => ({
          ...prev,
          avatar: userData.avatar ?? '',
        }))
        setUser((prev) => ({ ...(prev ?? {}), ...userData }))
      }
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to upload avatar.')
    } finally {
      setBusy(false)
      ev.target.value = ''
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.',
    )
    if (!confirmed) return

    setBusy(true)
    setError('')
    try {
      await api.delete('/api/users/me')
      localStorage.removeItem('token')
      await logout()
      navigate('/', { replace: true })
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to delete account.')
    } finally {
      setBusy(false)
    }
  }

  if (!user) {
    return null
  }

  if (loadingProfile) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-600 shadow-sm">
        Loading profile…
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-gray-200 bg-white px-4 py-8 text-left shadow-sm sm:px-6">
      {toast ? (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-8 flex items-center gap-4 sm:gap-5">
        <label
          htmlFor="avatarUpload"
          className="group relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#D85A30] text-xl font-semibold text-white"
        >
          {form.avatar ? (
            <img
              src={avatarSrc()}
              alt="Profile avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials()}</span>
          )}
          <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-xs font-medium text-white group-hover:flex">
            Upload
          </span>
        </label>
        <input
          id="avatarUpload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
        <div className="flex min-h-20 flex-1 flex-col justify-center gap-1">
          <h1 className="text-2xl font-semibold leading-tight text-gray-900">My profile</h1>
          <p className="text-sm text-gray-600">Member since {memberSinceLabel()}</p>
          <span className="mt-1 inline-flex w-fit rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#D85A30]">
            {String(form.plan || 'free')}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              First name
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={updateField('firstName')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Last name
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={updateField('lastName')}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={form.email} readOnly className="bg-gray-50" />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Contact &amp; location
          </p>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-3">
            <div className="min-w-0 sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+212 6 12 34 56 78"
                value={form.phone}
                onChange={updateField('phone')}
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                autoComplete="country-name"
                placeholder="Morocco"
                value={form.country}
                onChange={updateField('country')}
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                autoComplete="address-level2"
                placeholder="Fes"
                value={form.city}
                onChange={updateField('city')}
              />
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
          <textarea
            rows={3}
            autoComplete="street-address"
            placeholder="Street, building, neighborhood…"
            value={form.address}
            onChange={updateField('address')}
            className="w-full resize-y rounded-2xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#D85A30] focus:ring-1 focus:ring-[#D85A30]"
          />
          <p className="mt-1 text-xs text-gray-500">
            Saved on your account so we can recommend nearby services later.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-[#F6EFE9]/40 p-4 sm:p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Security</p>
          {form.hasGoogleLogin ? (
            <p className="text-sm leading-relaxed text-gray-600">
              Your account is linked to Google. To change how you sign in, manage your password and security in your
              Google Account.
            </p>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-3">
              {pwdErr ? <p className="text-sm text-red-600">{pwdErr}</p> : null}
              {pwdMsg ? <p className="text-sm text-green-700">{pwdMsg}</p> : null}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Current password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">New password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Confirm new password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                />
              </div>
              <button type="submit" className="secondary" disabled={pwdBusy}>
                {pwdBusy ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" className="primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" className="logout" disabled={busy} onClick={handleLogout}>
            {busy ? 'Signing out…' : 'Log out'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleDeleteAccount}
            className="bg-red-100 text-red-700"
          >
            Delete account
          </button>
        </div>
      </form>
    </div>
  )
}

export function AccountPetsTab() {
  return <MyPetsTab />
}

export function AccountBookingsTab() {
  return <BookingsTab />
}

export function AccountReviewsTab() {
  const { user } = useContext(UserContext)
  const [reviews, setReviews] = useState([])
  const [trustedClient, setTrustedClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!user?.id) {
        setLoading(false)
        return
      }
      setLoading(true)
      setErr('')
      try {
        const { data } = await api.get(`/api/reviews/owner/${user.id}`)
        if (ignore) return
        setReviews(Array.isArray(data?.reviews) ? data.reviews : [])
        setTrustedClient(Boolean(data?.trustedClient))
      } catch (e) {
        if (!ignore) {
          setReviews([])
          setTrustedClient(false)
          setErr(e?.response?.data?.error || 'Could not load reviews.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [user?.id])

  return (
    <div className="rounded-2xl border border-[#EADFD6] bg-white p-5 shadow-sm">
      <h1 className="text-lg font-semibold text-gray-900">Reviews from professionals</h1>
      <p className="mt-1 text-sm text-gray-600">
        After completed bookings, professionals can leave feedback about you and your pet. It appears here once the review
        window ends or both sides have submitted.
      </p>
      {trustedClient ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#FEF3EE] px-3 py-1.5 text-sm font-semibold text-[#E05C2A] ring-1 ring-[#E05C2A]/30">
          <FaStar className="h-4 w-4" aria-hidden />
          Trusted client — 5+ completed bookings with reviews
        </p>
      ) : null}
      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Loading…</p>
      ) : err ? (
        <p className="mt-6 text-sm text-red-600">{err}</p>
      ) : (
        <div className="mt-6">
          <ReviewList reviews={reviews} variant="proToOwner" />
        </div>
      )}
    </div>
  )
}

export function AccountActivityTab() {
  return <ActivityTab />
}

export function AccountNotificationsTab() {
  return <AccountPlaceholder title="Notifications" />
}

export function AccountSubscriptionTab() {
  const location = useLocation()
  const { user, setUser } = useContext(UserContext)
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: '/month',
      cta: 'Current plan',
      features: ['Basic booking access', 'Standard support', 'Community reviews'],
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 99,
      period: '/month',
      cta: 'Upgrade',
      features: ['Priority listing', 'Advanced insights', 'Faster support'],
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 199,
      period: '/month',
      cta: 'Upgrade',
      features: ['Top listing boost', 'Premium support', 'Extended analytics'],
      popular: false,
    },
  ]

  const [selectedPlan, setSelectedPlan] = useState('free')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [currentPlan, setCurrentPlan] = useState('free')

  useEffect(() => {
    setCurrentPlan(String(user?.plan || 'free').toLowerCase())
    setSelectedPlan(String(user?.plan || 'free').toLowerCase())
  }, [user?.plan])

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const { data } = await api.get('/api/users/me')
        const plan = String(data?.user?.plan || 'free').toLowerCase()
        if (!ignore) {
          setCurrentPlan(plan)
          setSelectedPlan(plan)
          setUser((prev) => ({ ...(prev || {}), ...(data?.user || {}), plan }))
        }
      } catch {
        // Keep current state if profile refresh fails.
      }
    })()
    return () => {
      ignore = true
    }
  }, [setUser])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('success') === 'true') {
      setMessage('Payment successful 🎉')
      setError('')
      const next = new URLSearchParams(location.search)
      next.delete('success')
      window.history.replaceState({}, '', `${location.pathname}${next.toString() ? `?${next.toString()}` : ''}`)
    } else if (params.get('canceled') === 'true') {
      setError('Payment canceled')
      setMessage('')
      const next = new URLSearchParams(location.search)
      next.delete('canceled')
      window.history.replaceState({}, '', `${location.pathname}${next.toString() ? `?${next.toString()}` : ''}`)
    }
  }, [location.pathname, location.search])

  async function handleUpgrade(planId) {
    setSelectedPlan(planId)
    setMessage('')
    setError('')
    if (planId === 'free' || planId === currentPlan) return
    setSubmitting(true)
    try {
      const { data } = await api.post('/api/stripe/create-checkout-session', { plan: planId })
      const url = String(data?.url || '')
      if (!url) {
        throw new Error('Missing Stripe checkout URL')
      }
      window.location.assign(url)
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not start checkout.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Subscription</h1>
        <p className="mt-1 text-sm text-gray-600">Choose a plan that matches your needs. You can upgrade anytime.</p>
        <p className="mt-2 inline-flex rounded-full bg-[#FEF3EE] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#E05C2A]">
          Current plan: {currentPlan}
        </p>
        {message ? (
          <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {plans.map((plan) => {
          const active = selectedPlan === plan.id
          const isCurrent = currentPlan === plan.id
          const disabled = submitting || isCurrent || plan.id === 'free'
          return (
            <article
              key={plan.id}
              className={[
                'relative rounded-2xl border bg-white p-5 shadow-sm transition-all',
                active ? 'border-[#E05C2A] ring-2 ring-[#E05C2A]/20' : 'border-gray-200 hover:border-[#E05C2A]/30',
              ].join(' ')}
            >
              {plan.popular ? (
                <span className="absolute -top-2 right-3 rounded-full bg-[#E05C2A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              ) : null}
              <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {plan.price === 0 ? 'Free' : `${plan.price} MAD`}
                {plan.price > 0 ? <span className="ml-1 text-sm font-medium text-gray-500">{plan.period}</span> : null}
              </p>
              <ul className="mt-3 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-[#E05C2A]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleUpgrade(plan.id)}
                disabled={disabled}
                className={[
                  'mt-4 w-full rounded-xl py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                  plan.id === 'free'
                    ? 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    : 'bg-[#E05C2A] text-white hover:bg-[#c44e28]',
                ].join(' ')}
              >
                {isCurrent ? 'Current plan' : plan.cta}
              </button>
            </article>
          )
        })}
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-xs text-gray-500 shadow-sm">
        <p className="inline-flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-[#E05C2A]" />
          Stripe Checkout test mode is enabled.
        </p>
        <p className="mt-2">Use test cards in Stripe-hosted checkout (4242 4242 4242 4242).</p>
      </div>
    </div>
  )
}
