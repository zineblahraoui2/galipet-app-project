import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { api } from '../../api/client.js'
import BookingActions, { StatusBadge } from '../BookingActions.jsx'
import { formatBookingDateTime, serviceLabel, servicePillClasses } from '../pro/bookingUtils.js'

export default function BookingContextCard({
  booking,
  threadBookings,
  focusBookingId,
  isPro,
  onBookingFocusChange,
  onBookingUpdated,
  scrollAnchorRef,
}) {
  const [open, setOpen] = useState(true)
  const [busy, setBusy] = useState(false)
  if (!booking?._id) return null

  const status = String(booking.status || '').toLowerCase()

  async function updateStatus(next) {
    if (!booking._id || busy) return
    setBusy(true)
    try {
      await api.put(`/api/bookings/${booking._id}/status`, { status: next })
      onBookingUpdated?.({ ...booking, status: next })
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const bookingsHref = isPro ? '/pro/bookings' : '/account/bookings'

  const options = Array.isArray(threadBookings) ? threadBookings : []
  const showBookingPicker = options.length > 1 && typeof onBookingFocusChange === 'function'
  const selectValue = String(booking?._id || focusBookingId || options[0]?._id || '')

  return (
    <div ref={scrollAnchorRef} className="border-b border-gray-100 bg-white px-4 py-3 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-gray-900">🗓 Appointment details</span>
        {open ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
      </button>
      {showBookingPicker ? (
        <label className="mt-2 block text-xs text-gray-500">
          <span className="mb-1 block font-medium text-gray-600">Focus booking</span>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900"
            value={selectValue}
            onChange={(e) => onBookingFocusChange(e.target.value)}
          >
            {options.map((b) => (
              <option key={String(b._id)} value={String(b._id)}>
                {serviceLabel(b.serviceType)} · {formatBookingDateTime(b)} · {String(b.status || '')}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {open ? (
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <p>
            <span className="text-gray-500">Service:</span>{' '}
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${servicePillClasses(booking.serviceType)}`}>
              {serviceLabel(booking.serviceType)}
            </span>
          </p>
          <p>
            <span className="text-gray-500">Date:</span> {formatBookingDateTime(booking)}
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-gray-500">Status:</span>
            <StatusBadge status={status} />
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to={bookingsHref}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              View booking
            </Link>
            {isPro && status === 'pending' ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updateStatus('confirmed')}
                  className="rounded-lg bg-[#E05C2A] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updateStatus('cancelled')}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-50"
                >
                  Decline
                </button>
              </>
            ) : null}
            {isPro && ['confirmed', 'late', 'rescheduled'].includes(status) ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updateStatus('completed')}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Mark done
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updateStatus('cancelled')}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : null}
          </div>
          <BookingActions
            booking={booking}
            userRole={isPro ? 'professional' : 'owner'}
            onBookingUpdated={onBookingUpdated}
          />
        </div>
      ) : null}
    </div>
  )
}
