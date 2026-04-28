import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BookingActions, { StatusBadge } from '../BookingActions.jsx'
import {
  avatarColorClass,
  formatBookingDateTime,
  petDisplayName,
  serviceLabel,
  servicePillClasses,
} from './bookingUtils.js'

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'GP'
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

export default function BookingDrawer({
  booking,
  open,
  onClose,
  busy,
  onStatusUpdate,
  onBookingMetaUpdate,
}) {
  const navigate = useNavigate()
  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !booking) return null

  const ownerUserId = booking?.ownerUserId ? String(booking.ownerUserId) : ''
  const name = booking?.user?.name || 'Client'
  const email = booking?.user?.email || ''
  const status = String(booking?.status || '').toLowerCase()
  const pet = petDisplayName(booking)
  const notes = typeof booking?.notes === 'string' && booking.notes.trim() ? booking.notes.trim() : null

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
      />
      <aside
        className="relative z-[71] flex h-full w-full max-w-full flex-col bg-white shadow-2xl transition-transform duration-[250ms] ease-out sm:max-w-[380px]"
        style={{ animation: 'slideInDrawer 250ms ease-out forwards' }}
      >
        <style>{`
          @keyframes slideInDrawer {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="text-sm font-semibold text-gray-900">Booking details</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <section className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Client</p>
            <div className="mt-3 flex items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ${avatarColorClass(name)}`}
              >
                {initials(name)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{name}</p>
                <p className="truncate text-sm text-gray-600">{email || '—'}</p>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pet</p>
            <p className="mt-2 text-sm text-gray-800">{pet ? `🐾 ${pet}` : 'Not specified'}</p>
          </section>

          <section className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Service</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${servicePillClasses(booking.serviceType)}`}>
                {serviceLabel(booking.serviceType)}
              </span>
              <span className="text-sm text-gray-600">{formatBookingDateTime(booking)}</span>
            </div>
          </section>

          <section className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{notes || 'No notes added'}</p>
          </section>

          <section className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Booking history</p>
            <ul className="mt-3 space-y-2 border-l-2 border-[#F6EFE9] pl-4">
              <li className="text-sm text-gray-700">
                <span className="font-medium">Current status:</span>{' '}
                <StatusBadge status={status} />
              </li>
            </ul>
          </section>

          <section data-booking-action>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</p>
            {ownerUserId ? (
              <button
                type="button"
                onClick={() => {
                  navigate(`/pro/messages?userId=${encodeURIComponent(ownerUserId)}`)
                  onClose?.()
                }}
                className="mb-3 w-full rounded-lg border border-[#E05C2A] py-2.5 text-sm font-semibold text-[#E05C2A] transition hover:bg-[#FEF3EE]"
              >
                Message owner
              </button>
            ) : null}
            {status === 'pending' ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onStatusUpdate?.(booking._id, 'confirmed')}
                  className="w-full rounded-lg bg-[#E05C2A] py-2.5 text-sm font-semibold text-white transition hover:bg-[#c94f24] disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onStatusUpdate?.(booking._id, 'cancelled')}
                  className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            ) : null}
            {['confirmed', 'late', 'rescheduled'].includes(status) ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onStatusUpdate?.(booking._id, 'completed')}
                  className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  Mark done
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onStatusUpdate?.(booking._id, 'cancelled')}
                  className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : null}
            {status === 'completed' ? (
              <p className="text-sm font-medium text-green-600">✓ Completed</p>
            ) : null}
            {status === 'cancelled' ? (
              <p className="text-sm font-medium text-gray-500">✗ Cancelled</p>
            ) : null}
            <BookingActions
              booking={booking}
              userRole="professional"
              onBookingUpdated={onBookingMetaUpdate}
            />
          </section>
        </div>
      </aside>
    </div>
  )
}
