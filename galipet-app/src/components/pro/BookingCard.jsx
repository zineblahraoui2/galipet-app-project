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

export default function BookingCard({
  booking,
  variant = 'list',
  busy = false,
  onOpenDrawer,
  onStatusUpdate,
  onBookingMetaUpdate,
  userRole = 'professional',
}) {
  const name = booking?.user?.name || 'Client'
  const status = String(booking?.status || '').toLowerCase()
  const pet = petDisplayName(booking)

  function cardClick(e) {
    if (e.target.closest('[data-booking-action]')) return
    onOpenDrawer?.(booking)
  }

  const actions = (() => {
    if (status === 'pending') {
      return (
        <div className="flex flex-wrap gap-2" data-booking-action>
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatusUpdate?.(booking._id, 'confirmed')}
            className="rounded-lg bg-[#E05C2A] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#c94f24] disabled:opacity-50"
          >
            Accept
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatusUpdate?.(booking._id, 'cancelled')}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )
    }
    if (['confirmed', 'late', 'rescheduled'].includes(status)) {
      return (
        <div className="flex flex-wrap gap-2" data-booking-action>
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatusUpdate?.(booking._id, 'completed')}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            Mark done
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatusUpdate?.(booking._id, 'cancelled')}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )
    }
    if (status === 'completed') {
      return <p className="text-sm font-medium text-green-600">✓ Completed</p>
    }
    if (status === 'cancelled') {
      return <p className="text-sm font-medium text-gray-500">✗ Cancelled</p>
    }
    return null
  })()

  if (variant === 'compact') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={cardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpenDrawer?.(booking)
          }
        }}
        className="cursor-pointer rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md"
      >
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="mt-1 text-xs text-gray-600">{formatBookingDateTime(booking)}</p>
        <span
          className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${servicePillClasses(booking.serviceType)}`}
        >
          {serviceLabel(booking.serviceType)}
        </span>
        <div className="mt-3 border-t border-gray-100 pt-2">{actions}</div>
        <div data-booking-action onClick={(e) => e.stopPropagation()}>
          <BookingActions booking={booking} userRole={userRole} onBookingUpdated={onBookingMetaUpdate} />
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={cardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenDrawer?.(booking)
        }
      }}
      className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColorClass(name)}`}
          >
            {initials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900">{name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${servicePillClasses(booking.serviceType)}`}
              >
                {serviceLabel(booking.serviceType)}
              </span>
              {pet ? (
                <span className="text-sm text-gray-500">
                  🐾 {pet}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 lg:shrink-0">
          <p className="text-sm font-medium text-gray-700 lg:text-right">{formatBookingDateTime(booking)}</p>
          <StatusBadge status={status} />
          <div className="min-w-0 lg:w-auto">{actions}</div>
        </div>
        <div className="mt-3 border-t border-gray-100 pt-3" data-booking-action onClick={(e) => e.stopPropagation()}>
          <BookingActions booking={booking} userRole={userRole} onBookingUpdated={onBookingMetaUpdate} />
        </div>
      </div>
    </div>
  )
}
