import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../api/client.js'
import BookingDrawer from '../../components/pro/BookingDrawer.jsx'
import CalendarHeader from '../../components/pro/CalendarHeader.jsx'
import DayView from '../../components/pro/DayView.jsx'
import MiniMonthNav from '../../components/pro/MiniMonthNav.jsx'
import MonthView from '../../components/pro/MonthView.jsx'
import ScheduleDrawer from '../../components/pro/ScheduleDrawer.jsx'
import Toast from '../../components/pro/Toast.jsx'
import WeekView from '../../components/pro/WeekView.jsx'
import { addBlockedDate, getMonthGrid, getWeekDays } from '../../components/pro/calendarUtils.js'

function scheduleShape(data) {
  if (!data?.weeklySchedule) return null
  return {
    weeklySchedule: data.weeklySchedule,
    blockedDates: data.blockedDates || [],
    isAway: Boolean(data.isAway),
    dailyCapacity: data.dailyCapacity ?? 5,
  }
}

export default function ProCalendarPage() {
  const [bookings, setBookings] = useState([])
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('week')
  const [workDate, setWorkDate] = useState(() => new Date())
  const [monthViewDate, setMonthViewDate] = useState(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), 1)
  })
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [toast, setToast] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const capacityDebounce = useRef(null)

  const showToast = useCallback((t) => {
    setToast(t)
  }, [])

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [bk, sc] = await Promise.all([api.get('/api/pro/bookings'), api.get('/api/pro/schedule')])
        if (ignore) return
        setBookings(Array.isArray(bk.data?.bookings) ? bk.data.bookings : [])
        setSchedule(scheduleShape(sc.data))
      } catch (e) {
        if (!ignore) {
          setBookings([])
          setSchedule(null)
          setError(e?.response?.data?.error || e?.message || 'Could not load calendar.')
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

  const weekDays = useMemo(() => getWeekDays(workDate), [workDate])
  const monthGrid = useMemo(() => getMonthGrid(monthViewDate), [monthViewDate])

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
        if (newStatus === 'confirmed') showToast({ message: 'Booking confirmed ✓', type: 'ok' })
        else if (newStatus === 'cancelled') showToast({ message: 'Booking cancelled', type: 'ok' })
        else if (newStatus === 'completed') showToast({ message: 'Booking marked done ✓', type: 'ok' })
      } catch (e) {
        showToast({ message: e?.response?.data?.error || 'Action failed', type: 'error' })
      } finally {
        setBusyId(null)
      }
    },
    [showToast],
  )

  const toggleAway = useCallback(async () => {
    if (!schedule) return
    const next = !schedule.isAway
    setSchedule((s) => ({ ...s, isAway: next }))
    try {
      await api.put('/api/pro/away', { isAway: next })
      showToast({
        message: next ? "Away mode on — you're hidden from search" : "You're active again ✓",
        type: 'ok',
      })
    } catch (e) {
      setSchedule((s) => ({ ...s, isAway: !next }))
      showToast({ message: e?.response?.data?.error || 'Failed to update away mode', type: 'error' })
    }
  }, [schedule, showToast])

  const persistCapacity = useCallback(
    async (value) => {
      try {
        const { data } = await api.put('/api/pro/schedule', { dailyCapacity: value })
        const shaped = scheduleShape(data)
        if (shaped) setSchedule((prev) => ({ ...prev, ...shaped }))
      } catch {
        showToast({ message: 'Could not save capacity', type: 'error' })
      }
    },
    [showToast],
  )

  const onCapacityChange = (v) => {
    const n = Number(v)
    setSchedule((s) => (s ? { ...s, dailyCapacity: n } : s))
    if (capacityDebounce.current) clearTimeout(capacityDebounce.current)
    capacityDebounce.current = setTimeout(() => persistCapacity(n), 500)
  }

  const handleNavPrev = () => {
    if (view === 'week') {
      const d = new Date(workDate)
      d.setDate(d.getDate() - 7)
      setWorkDate(d)
    } else if (view === 'month') {
      const d = new Date(monthViewDate)
      d.setMonth(d.getMonth() - 1)
      setMonthViewDate(d)
    } else {
      const d = new Date(workDate)
      d.setDate(d.getDate() - 1)
      setWorkDate(d)
    }
  }

  const handleNavNext = () => {
    if (view === 'week') {
      const d = new Date(workDate)
      d.setDate(d.getDate() + 7)
      setWorkDate(d)
    } else if (view === 'month') {
      const d = new Date(monthViewDate)
      d.setMonth(d.getMonth() + 1)
      setMonthViewDate(d)
    } else {
      const d = new Date(workDate)
      d.setDate(d.getDate() + 1)
      setWorkDate(d)
    }
  }

  const handleNavToday = () => {
    const t = new Date()
    setWorkDate(t)
    setMonthViewDate(new Date(t.getFullYear(), t.getMonth(), 1))
  }

  const handlePickMonthCell = (d) => {
    setWorkDate(d)
    setMonthViewDate(new Date(d.getFullYear(), d.getMonth(), 1))
    setView('day')
  }

  const handleMiniPick = (d) => {
    setWorkDate(d)
    setMonthViewDate(new Date(d.getFullYear(), d.getMonth(), 1))
    setView('day')
  }

  const handleBlockDay = async (isoKey) => {
    if (!schedule) return
    const next = addBlockedDate(schedule.blockedDates, isoKey)
    try {
      const { data } = await api.put('/api/pro/schedule', { blockedDates: next })
      const shaped = scheduleShape(data)
      if (shaped) setSchedule(shaped)
      showToast({ message: 'Day blocked', type: 'ok' })
    } catch (e) {
      showToast({ message: e?.response?.data?.error || 'Could not block day', type: 'error' })
    }
  }

  const onScheduleSaved = (data) => {
    const shaped = scheduleShape(data)
    if (shaped) setSchedule(shaped)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-3">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-gray-200/80" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-200/80" />
      </div>
    )
  }

  if (error) {
    return <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
  }

  if (!schedule) {
    return <p className="text-sm text-gray-600">No schedule data.</p>
  }

  const isAway = schedule.isAway

  return (
    <div className="mx-auto flex max-w-6xl gap-4 pb-10">
      <div className="hidden w-[200px] shrink-0 flex-col gap-4 md:flex">
        <MiniMonthNav
          anchorDate={monthViewDate}
          onAnchorChange={(d) => setMonthViewDate(d)}
          bookings={bookings}
          onPickDate={handleMiniPick}
        />
        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-500">Daily capacity</p>
          <input
            type="range"
            min={1}
            max={20}
            value={schedule.dailyCapacity}
            onChange={(e) => onCapacityChange(e.target.value)}
            className="mt-2 w-full accent-[#E05C2A]"
          />
          <p className="mt-1 text-sm text-gray-700">{schedule.dailyCapacity} slots / day</p>
        </div>
        <button
          type="button"
          onClick={() => setShowSchedule(true)}
          className="rounded-xl bg-[#E05C2A] px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#c94f24]"
        >
          Manage schedule
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <CalendarHeader
          view={view}
          onViewChange={(v) => {
            setView(v)
            if (v === 'month') {
              setMonthViewDate(new Date(workDate.getFullYear(), workDate.getMonth(), 1))
            }
          }}
          onPrev={handleNavPrev}
          onNext={handleNavNext}
          onToday={handleNavToday}
          isAway={isAway}
          onToggleAway={toggleAway}
          onOpenScheduleMobile={() => setShowSchedule(true)}
        />

        {isAway ? (
          <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-800">
            You&apos;re in Away mode — owners cannot book you
          </div>
        ) : null}

        {view === 'week' ? (
          <WeekView
            weekDays={weekDays}
            bookings={bookings}
            weeklySchedule={schedule.weeklySchedule}
            blockedDates={schedule.blockedDates}
            dailyCapacity={schedule.dailyCapacity}
            isAway={isAway}
            onOpenBooking={setSelectedBooking}
          />
        ) : null}

        {view === 'month' ? (
          <MonthView
            monthAnchor={monthViewDate}
            gridDays={monthGrid}
            bookings={bookings}
            dailyCapacity={schedule.dailyCapacity}
            blockedDates={schedule.blockedDates}
            onPickDay={handlePickMonthCell}
          />
        ) : null}

        {view === 'day' ? (
          <DayView
            day={workDate}
            bookings={bookings}
            weeklySchedule={schedule.weeklySchedule}
            blockedDates={schedule.blockedDates}
            dailyCapacity={schedule.dailyCapacity}
            isAway={isAway}
            onOpenBooking={setSelectedBooking}
            onStatusUpdate={handleStatusUpdate}
            busyId={busyId}
            onBlockDay={handleBlockDay}
          />
        ) : null}
      </div>

      {selectedBooking ? (
        <BookingDrawer
          booking={selectedBooking}
          open={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          busy={String(busyId) === String(selectedBooking._id)}
          onStatusUpdate={handleStatusUpdate}
        />
      ) : null}

      {showSchedule ? (
        <ScheduleDrawer
          open={showSchedule}
          onClose={() => setShowSchedule(false)}
          schedule={schedule}
          onSaved={onScheduleSaved}
          onToast={showToast}
        />
      ) : null}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
