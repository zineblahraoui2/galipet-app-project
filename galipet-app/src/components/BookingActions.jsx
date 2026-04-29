import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  ListOrdered,
  Star,
} from 'lucide-react'
import { reportLate, reportNoShow, rescheduleBooking } from '../api/bookings.js'

function bookingDateTime(booking) {
  if (booking?.startAt) {
    const s = new Date(booking.startAt)
    return Number.isNaN(s.getTime()) ? null : s
  }
  const d = booking?.date ? new Date(booking.date) : null
  if (!d || Number.isNaN(d.getTime())) return null
  const [hh = 9, mm = 0] = String(booking.timeSlot || '09:00')
    .split(':')
    .map((n) => parseInt(n, 10))
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0, 0)
}

const STATUS_BADGE = {
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-800', ring: 'ring-amber-200', Icon: Clock },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-100', text: 'text-emerald-800', ring: 'ring-emerald-200', Icon: CheckCircle2 },
  completed: { label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-200', Icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-800', ring: 'ring-red-200', Icon: Ban },
  late: { label: 'Running late', bg: 'bg-orange-100', text: 'text-orange-800', ring: 'ring-orange-200', Icon: Clock },
  no_show: { label: 'No-show', bg: 'bg-red-100', text: 'text-red-800', ring: 'ring-red-200', Icon: Ban },
  rescheduled: { label: 'Rescheduled', bg: 'bg-sky-100', text: 'text-sky-800', ring: 'ring-sky-200', Icon: CalendarClock },
}

export function StatusBadge({ status }) {
  const s = String(status || 'pending').toLowerCase()
  const c = STATUS_BADGE[s] || STATUS_BADGE.pending
  const Icon = c.Icon
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${c.bg} ${c.text} ${c.ring}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
      {c.label}
    </span>
  )
}

export default function BookingActions({ booking, userRole, onBookingUpdated }) {
  const [showReschedule, setShowReschedule] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const status = String(booking?.status || '').toLowerCase()
  const role = String(userRole || '').toLowerCase()

  const apptTime = useMemo(() => bookingDateTime(booking), [booking?.date, booking?.timeSlot, booking?.startAt])
  const now = new Date()
  const isPast = apptTime ? now > apptTime : false
  const diffMin = apptTime ? (now - apptTime) / 60000 : 0
  const isNearWindow = apptTime ? diffMin >= -30 && diffMin <= 120 : false

  function mergeResponse(data) {
    const b = data?.booking
    if (b && onBookingUpdated) onBookingUpdated(b)
  }

  async function handle(action) {
    if (!booking?._id || loading) return
    setLoading(true)
    setErr('')
    try {
      if (action === 'late') {
        const { data } = await reportLate(booking._id, 15)
        mergeResponse(data)
      } else if (action === 'no_show') {
        const { data } = await reportNoShow(booking._id)
        mergeResponse(data)
      } else if (action === 'reschedule') {
        const slot = String(newTime || '')
          .trim()
          .slice(0, 5)
        if (!newDate || !slot) {
          setErr('Pick a new date and time')
          setLoading(false)
          return
        }
        const { data } = await rescheduleBooking(booking._id, newDate, slot, reason)
        mergeResponse(data)
        setShowReschedule(false)
        setNewDate('')
        setNewTime('')
        setReason('')
      }
    } catch (e) {
      setErr(e?.response?.data?.error || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  const canReschedule =
    ['pending', 'confirmed', 'late', 'rescheduled'].includes(status) && !isPast && apptTime

  const showLate =
    status === 'confirmed' && isNearWindow && (role === 'owner' || role === 'professional')

  const showNoShow =
    ['confirmed', 'late'].includes(status) && isPast && (role === 'owner' || role === 'professional')

  const showReviewLink = status === 'completed' && role === 'owner'

  const histCount = Array.isArray(booking.rescheduleHistory) ? booking.rescheduleHistory.length : 0

  if (!booking?._id) return null

  return (
    <div className="mt-2 flex flex-col gap-2">
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
      <div className="flex flex-wrap gap-2">
        {canReschedule ? (
          <button
            type="button"
            onClick={() => setShowReschedule((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-100"
          >
            <CalendarClock className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
            Reschedule
          </button>
        ) : null}

        {showLate ? (
          <button
            type="button"
            onClick={() => handle('late')}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-800 transition hover:bg-orange-100 disabled:opacity-50"
          >
            <Clock className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
            Running late
          </button>
        ) : null}

        {showNoShow ? (
          <button
            type="button"
            onClick={() => handle('no_show')}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50"
          >
            <Ban className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
            No-show
          </button>
        ) : null}

        {showReviewLink ? (
          <Link
            to={`/review/${booking._id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
          >
            <Star className="h-3.5 w-3.5 text-[#E05C2A]" strokeWidth={2.25} aria-hidden />
            Leave a review
            <ChevronRight className="h-3.5 w-3.5 text-[#E05C2A]" strokeWidth={2.25} aria-hidden />
          </Link>
        ) : null}

        {histCount > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500">
            <ListOrdered className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Rescheduled {histCount}×
          </span>
        ) : null}
      </div>

      {showReschedule ? (
        <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-3">
          <p className="mb-2 text-xs font-semibold text-sky-900">Reschedule appointment</p>
          <div className="mb-2 flex flex-wrap gap-2">
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="min-w-[140px] flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-[#E05C2A]"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="min-w-[120px] flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-[#E05C2A]"
            />
          </div>
          <input
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mb-2 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-[#E05C2A]"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handle('reschedule')}
              disabled={!newDate || !newTime || loading}
              className="rounded-lg bg-[#E05C2A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#c94e22] disabled:opacity-50"
            >
              Confirm reschedule
            </button>
            <button
              type="button"
              onClick={() => setShowReschedule(false)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
