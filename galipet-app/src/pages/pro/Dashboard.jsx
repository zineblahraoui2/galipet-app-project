import { useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  FaBone,
  FaBoxOpen,
  FaBullseye,
  FaCalendarDay,
  FaChartLine,
  FaClipboardList,
  FaCut,
  FaDumbbell,
  FaFlask,
  FaHome,
  FaHourglassHalf,
  FaMapMarkerAlt,
  FaMedal,
  FaMoneyBillWave,
  FaStar,
  FaStethoscope,
  FaSyringe,
  FaTint,
} from 'react-icons/fa'
import AppointmentItem from '../../components/pro/AppointmentItem.jsx'
import RequestItem from '../../components/pro/RequestItem.jsx'
import StatCard from '../../components/pro/StatCard.jsx'
import ToolCard from '../../components/pro/ToolCard.jsx'
import { api } from '../../api/client.js'
import { UserContext } from '../../UserContext.jsx'
import ReviewPromptBanner from '../../components/reviews/ReviewPromptBanner.jsx'

const ORANGE_ICON = 'h-4 w-4 shrink-0 text-[#E05C2A]'

const SERVICE_PILLS = [
  { value: 'vet', label: 'Vet', Icon: FaStethoscope },
  { value: 'grooming', label: 'Groomer', Icon: FaCut },
  { value: 'sitting', label: 'Sitter', Icon: FaHome },
  { value: 'training', label: 'Trainer', Icon: FaDumbbell },
]

const TOOL_SETS = {
  vet: [
    { Icon: FaClipboardList, title: 'Medical records', value: '8' },
    { Icon: FaSyringe, title: 'Vaccines due', value: '5' },
    { Icon: FaFlask, title: 'Lab results pending', value: '2' },
  ],
  grooming: [
    { Icon: FaCut, title: 'Grooming plans', value: '6' },
    { Icon: FaTint, title: 'Spa sessions', value: '4' },
    { Icon: FaBoxOpen, title: 'Products low stock', value: '3' },
  ],
  sitting: [
    { Icon: FaHome, title: 'Home visits', value: '7' },
    { Icon: FaBone, title: 'Walk schedules', value: '9' },
    { Icon: FaMapMarkerAlt, title: 'Route checks', value: '2' },
  ],
  training: [
    { Icon: FaBullseye, title: 'Active programs', value: '5' },
    { Icon: FaChartLine, title: 'Progress reviews', value: '8' },
    { Icon: FaMedal, title: 'Graduations pending', value: '1' },
  ],
}

function serviceLabel(type) {
  const item = SERVICE_PILLS.find((s) => s.value === type)
  return item?.label || 'Service'
}

function formatName(s) {
  const v = String(s || '').trim()
  if (!v) return ''
  return v
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function dateLabel() {
  const now = new Date()
  const date = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `${date}`
}

function asDate(value) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function isBookingToday(booking) {
  const d = booking?.date ? new Date(booking.date) : null
  if (!d || Number.isNaN(d.getTime())) return false
  return d.toDateString() === new Date().toDateString()
}

function bookingTime(booking) {
  const t = String(booking?.timeSlot || '').trim()
  if (t) return t
  const d = asDate(booking?.date)
  if (!d) return '--:--'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatBookingDate(booking) {
  const d = asDate(booking?.date)
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatRevenue(mad) {
  const n = Math.round(Number(mad) || 0)
  return n.toLocaleString('fr-FR').replace(/\u202f/g, ' ')
}

export default function ProDashboardPage() {
  const { user } = useContext(UserContext)
  const location = useLocation()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)
  const [toastMsg, setToastMsg] = useState('')

  const role = String(user?.role || 'owner').toLowerCase()

  useEffect(() => {
    const t = location.state?.toast
    if (typeof t === 'string' && t.trim()) {
      setToastMsg(t.trim())
      navigate('.', { replace: true, state: {} })
    }
  }, [location.state, navigate])

  useEffect(() => {
    if (!toastMsg) return undefined
    const id = window.setTimeout(() => setToastMsg(''), 6000)
    return () => window.clearTimeout(id)
  }, [toastMsg])

  useEffect(() => {
    if (role !== 'professional' || !user?.id) return undefined
    let ignore = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [st, bk] = await Promise.all([api.get('/api/pro/stats'), api.get('/api/pro/bookings')])
        if (ignore) return
        setStats(st.data ?? null)
        setBookings(Array.isArray(bk.data?.bookings) ? bk.data.bookings : [])
      } catch (e) {
        if (!ignore) {
          setStats(null)
          setBookings([])
          setError(e?.response?.data?.error || e?.message || 'Could not load dashboard data.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [role, user?.id])

  const todayAppointments = useMemo(() => {
    return bookings
      .filter((b) => {
        const st = String(b?.status || '').toLowerCase()
        if (['cancelled', 'completed', 'no_show'].includes(st)) return false
        return isBookingToday(b)
      })
      .sort((a, b) => bookingTime(a).localeCompare(bookingTime(b)))
  }, [bookings])

  const pendingRequests = useMemo(
    () =>
      bookings
        .filter((b) => String(b?.status || '').toLowerCase() === 'pending')
        .sort((a, b) => {
          const ad = asDate(a?.date)?.getTime() || 0
          const bd = asDate(b?.date)?.getTime() || 0
          return ad - bd
        }),
    [bookings],
  )

  async function refreshStats() {
    try {
      const { data } = await api.get('/api/pro/stats')
      setStats(data ?? null)
    } catch {
      /* keep previous stats */
    }
  }

  async function acceptBooking(id) {
    setActionId(id)
    setError('')
    try {
      await api.put(`/api/bookings/${id}/status`, { status: 'confirmed' })
      setBookings((prev) =>
        prev.map((b) => (String(b._id) === String(id) ? { ...b, status: 'confirmed' } : b)),
      )
      await refreshStats()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not accept booking.')
    } finally {
      setActionId(null)
    }
  }

  async function rejectBooking(id) {
    setActionId(id)
    setError('')
    try {
      await api.put(`/api/bookings/${id}/status`, { status: 'cancelled' })
      setBookings((prev) =>
        prev.map((b) => (String(b._id) === String(id) ? { ...b, status: 'cancelled' } : b)),
      )
      await refreshStats()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not reject booking.')
    } finally {
      setActionId(null)
    }
  }

  const specialty = String(stats?.specialty || 'vet').toLowerCase()
  const tools = TOOL_SETS[specialty] || TOOL_SETS.vet
  const city = user?.city || 'Casablanca'

  const headingName = formatName(user?.name || 'Professional')
  const showPlaceholder = ['/pro/services'].includes(location.pathname)

  if (showPlaceholder) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-lg font-semibold text-gray-900">Coming soon</p>
        <p className="mt-2 text-sm text-gray-600">This section is planned. Dashboard is ready on the first menu item.</p>
      </div>
    )
  }

  const ratingDisplay = Number(stats?.rating ?? 0).toFixed(1)
  const reviewsCount = Number(stats?.reviewsCount ?? 0)
  const revenueDisplay = formatRevenue(stats?.revenue)

  return (
    <div className="mx-auto w-full max-w-6xl">
      <section className="rounded-2xl bg-[#F6EFE9] p-5 sm:p-6">
        {toastMsg ? (
          <div
            className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-800"
            role="status"
          >
            {toastMsg}
          </div>
        ) : null}
        <ReviewPromptBanner />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Good afternoon, Dr. {headingName}</h1>
            <p className="mt-1 text-sm font-medium text-gray-700">
              {dateLabel()} · {city}
            </p>
          </div>
          <span className="rounded-full bg-[#FEF3EE] px-3 py-1 text-sm font-semibold text-[#E05C2A]">Active</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {SERVICE_PILLS.map((pill) => {
            const active = pill.value === specialty
            const PillIcon = pill.Icon
            return (
              <button
                key={pill.value}
                type="button"
                className={[
                  'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition',
                  active
                    ? 'border-[#E05C2A] bg-[#FEF3EE] text-[#E05C2A]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-[#E05C2A]/40',
                ].join(' ')}
              >
                <PillIcon className={ORANGE_ICON} aria-hidden />
                {pill.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((k) => (
              <div key={k} className="h-[104px] animate-pulse rounded-2xl bg-gray-200/80" />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              title="Today"
              value={stats?.todayCount ?? 0}
              subtitle="Appointments today"
              Icon={FaCalendarDay}
            />
            <StatCard title="Revenue" value={revenueDisplay} subtitle="MAD this month" Icon={FaMoneyBillWave} />
            <StatCard
              title="Rating"
              value={ratingDisplay}
              subtitle={`${reviewsCount} reviews`}
              Icon={FaStar}
            />
            <StatCard title="Pending" value={stats?.pendingCount ?? 0} subtitle="To confirm" Icon={FaHourglassHalf} />
          </div>
        )}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Today&apos;s appointments</h2>
            {loading ? (
              <div className="mt-4 space-y-2">
                <div className="h-12 animate-pulse rounded-xl bg-gray-200/80" />
                <div className="h-12 animate-pulse rounded-xl bg-gray-200/80" />
              </div>
            ) : todayAppointments.length === 0 ? (
              <p className="mt-5 text-sm text-gray-500">You&apos;re free today 🐾</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {todayAppointments.map((b) => (
                  <AppointmentItem
                    key={b._id}
                    clientName={b.user?.name || 'Pet owner'}
                    petName={b.pet?.name || ''}
                    serviceLabel={serviceLabel(b.serviceType)}
                    time={bookingTime(b)}
                    status={String(b.status || '')}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Pending requests</h2>
            {loading ? (
              <div className="mt-4 space-y-2">
                <div className="h-14 animate-pulse rounded-xl bg-gray-200/80" />
                <div className="h-14 animate-pulse rounded-xl bg-gray-200/80" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <p className="mt-5 text-sm text-gray-500">No pending requests 🎉</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {pendingRequests.map((b) => (
                  <RequestItem
                    key={b._id}
                    clientName={b.user?.name || 'Pet owner'}
                    petLine={`${serviceLabel(b.serviceType)} · ${formatBookingDate(b)}`}
                    status={String(b.status || 'pending')}
                    busy={String(actionId) === String(b._id)}
                    onAccept={() => acceptBooking(b._id)}
                    onReject={() => rejectBooking(b._id)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">{serviceLabel(specialty)} tools</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.title} Icon={tool.Icon} title={tool.title} value={tool.value} />
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}
