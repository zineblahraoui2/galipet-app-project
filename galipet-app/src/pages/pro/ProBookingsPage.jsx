import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client.js'
import BookingCard from '../../components/pro/BookingCard.jsx'
import BookingDrawer from '../../components/pro/BookingDrawer.jsx'
import BookingFilters from '../../components/pro/BookingFilters.jsx'
import BookingKanban from '../../components/pro/BookingKanban.jsx'
import StatsBar from '../../components/pro/StatsBar.jsx'
import Toast from '../../components/pro/Toast.jsx'
import {
  isDateInThisWeek,
  SERVICE_PRICE_MAD,
} from '../../components/pro/bookingUtils.js'

function emptyMessage(activeFilter, hasBookings, hasSearch) {
  if (hasSearch) return 'No bookings match your search'
  if (!hasBookings) return 'No bookings yet 🐾  Share your profile to get started'
  switch (activeFilter) {
    case 'pending':
      return 'No pending requests — you\'re all caught up 🎉'
    case 'confirmed':
      return 'No confirmed appointments'
    case 'completed':
      return 'No completed sessions yet'
    case 'cancelled':
      return 'No cancelled bookings'
    case 'late':
      return 'No late bookings'
    case 'rescheduled':
      return 'No rescheduled bookings'
    case 'no_show':
      return 'No no-show records'
    default:
      return 'No bookings match this filter'
  }
}

export default function ProBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState('list')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [toast, setToast] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get('/api/pro/bookings')
        if (ignore) return
        setBookings(Array.isArray(data?.bookings) ? data.bookings : [])
      } catch (e) {
        if (!ignore) {
          setBookings([])
          setError(e?.response?.data?.error || e?.message || 'Could not load bookings.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [])

  const counts = useMemo(() => {
    const c = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      late: 0,
      no_show: 0,
      rescheduled: 0,
    }
    for (const b of bookings) {
      const s = String(b?.status || '').toLowerCase()
      if (s in c) c[s] += 1
    }
    return c
  }, [bookings])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bookings
      .filter((b) => {
        if (activeFilter === 'all') return true
        const s = String(b?.status || '').toLowerCase()
        if (activeFilter === 'confirmed') return ['confirmed', 'late', 'rescheduled'].includes(s)
        return s === activeFilter
      })
      .filter((b) => {
        if (!q) return true
        const name = String(b?.user?.name || '').toLowerCase()
        const svc = String(b?.serviceType || '').toLowerCase()
        return name.includes(q) || svc.includes(q)
      })
      .sort((a, b) => {
        const ta = new Date(a?.createdAt || a?.date || 0).getTime()
        const tb = new Date(b?.createdAt || b?.date || 0).getTime()
        return tb - ta
      })
  }, [bookings, activeFilter, search])

  const grouped = useMemo(() => {
    const g = { pending: [], confirmed: [], completed: [], cancelled: [] }
    for (const b of filtered) {
      const s = String(b?.status || '').toLowerCase()
      if (s === 'late' || s === 'rescheduled') {
        g.confirmed.push(b)
      } else if (s === 'no_show') {
        g.completed.push(b)
      } else if (g[s]) {
        g[s].push(b)
      }
    }
    return g
  }, [filtered])

  const stats = useMemo(() => {
    const total = bookings.length
    const pending = counts.pending
    const thisWeek = bookings.filter((b) => isDateInThisWeek(b?.date)).length
    const revenue = bookings
      .filter((b) => String(b?.status || '').toLowerCase() === 'completed')
      .reduce((sum, b) => {
        const t = String(b?.serviceType || '').toLowerCase()
        return sum + (SERVICE_PRICE_MAD[t] ?? 0)
      }, 0)
    return { total, pending, thisWeek, revenue }
  }, [bookings, counts.pending])

  const toastForStatus = useCallback((newStatus) => {
    if (newStatus === 'confirmed') return 'Booking confirmed ✓'
    if (newStatus === 'cancelled') return 'Booking cancelled'
    if (newStatus === 'completed') return 'Booking marked done ✓'
    return `Booking ${newStatus}`
  }, [])

  const handleBookingMetaUpdate = useCallback((ub) => {
    if (!ub?._id) return
    setBookings((prev) => prev.map((b) => (String(b._id) === String(ub._id) ? { ...b, ...ub } : b)))
    setSelectedBooking((prev) => (prev && String(prev._id) === String(ub._id) ? { ...prev, ...ub } : prev))
  }, [])

  const handleStatusUpdate = useCallback(
    async (bookingId, newStatus) => {
      setBusyId(bookingId)
      try {
        await api.put(`/api/bookings/${bookingId}/status`, { status: newStatus })
        setBookings((prev) =>
          prev.map((b) => (String(b._id) === String(bookingId) ? { ...b, status: newStatus } : b)),
        )
        setSelectedBooking((prev) =>
          prev && String(prev._id) === String(bookingId) ? { ...prev, status: newStatus } : prev,
        )
        setToast({ message: toastForStatus(newStatus), type: newStatus })
      } catch (e) {
        setToast({ message: e?.response?.data?.error || 'Action failed, try again', type: 'error' })
      } finally {
        setBusyId(null)
      }
    },
    [toastForStatus],
  )

  const hasSearch = search.trim().length > 0
  const showEmpty = !loading && !error && filtered.length === 0

  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Bookings</h1>
          <p className="mt-1 text-sm text-gray-600">
            {loading ? '…' : `${bookings.length} appointment${bookings.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                view === 'list' ? 'bg-[#E05C2A] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              List view
            </button>
            <button
              type="button"
              onClick={() => setView('kanban')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                view === 'kanban' ? 'bg-[#E05C2A] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Kanban view
            </button>
          </div>
        </div>
      </div>

      {!loading && !error ? (
        <div className="mb-5">
          <StatsBar
            total={stats.total}
            pending={stats.pending}
            thisWeek={stats.thisWeek}
            revenueMad={stats.revenue}
          />
        </div>
      ) : null}

      <div className="mb-5">
        <BookingFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          search={search}
          onSearchChange={setSearch}
          counts={counts}
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="h-28 animate-pulse rounded-2xl bg-gray-200/80" />
          ))}
        </div>
      ) : null}

      {showEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/60 py-16 text-center">
          <span className="text-4xl text-gray-300" aria-hidden>
            📅
          </span>
          <p className="mt-4 max-w-md text-sm text-gray-600">{emptyMessage(activeFilter, bookings.length > 0, hasSearch)}</p>
        </div>
      ) : null}

      {!loading && !error && filtered.length > 0 && view === 'list' ? (
        <ul className="space-y-3">
          {filtered.map((b) => (
            <li key={b._id}>
              <BookingCard
                booking={b}
                variant="list"
                busy={String(busyId) === String(b._id)}
                onOpenDrawer={setSelectedBooking}
                onStatusUpdate={handleStatusUpdate}
                onBookingMetaUpdate={handleBookingMetaUpdate}
                userRole="professional"
              />
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && !error && filtered.length > 0 && view === 'kanban' ? (
        <BookingKanban
          grouped={grouped}
          busyId={busyId}
          onOpenDrawer={setSelectedBooking}
          onStatusUpdate={handleStatusUpdate}
          onBookingMetaUpdate={handleBookingMetaUpdate}
        />
      ) : null}

      {selectedBooking ? (
        <BookingDrawer
          booking={selectedBooking}
          open={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          busy={String(busyId) === String(selectedBooking._id)}
          onStatusUpdate={handleStatusUpdate}
          onBookingMetaUpdate={handleBookingMetaUpdate}
        />
      ) : null}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
