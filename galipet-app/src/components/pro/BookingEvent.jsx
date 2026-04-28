import { serviceLabel } from './bookingUtils.js'
import {
  bookingDurationMinutes,
  bookingStartMinutes,
  getSlotTop,
  GRID_START_HOUR,
  PX_PER_HOUR,
} from './calendarUtils.js'

function serviceColors(type) {
  const t = String(type || '').toLowerCase()
  if (t === 'vet') return 'bg-blue-50 border-l-4 border-blue-500 text-blue-900'
  if (t === 'grooming') return 'bg-purple-50 border-l-4 border-purple-500 text-purple-900'
  if (t === 'sitting') return 'bg-green-50 border-l-4 border-green-500 text-green-900'
  if (t === 'training') return 'bg-orange-50 border-l-4 border-orange-500 text-orange-900'
  return 'bg-gray-50 border-l-4 border-gray-400 text-gray-900'
}

function statusOverlay(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'pending') return 'border border-dashed border-yellow-400 bg-yellow-50/40'
  if (s === 'confirmed') return ''
  if (s === 'completed') return 'opacity-60'
  if (s === 'cancelled') return 'opacity-40 line-through'
  return ''
}

export default function BookingEvent({ booking, onOpen, compact }) {
  const name = booking?.user?.name || 'Client'
  const status = String(booking?.status || '').toLowerCase()
  const startMin = bookingStartMinutes(booking, GRID_START_HOUR)
  const top = getSlotTop(`${Math.floor(startMin / 60)}:${String(startMin % 60).padStart(2, '0')}`, GRID_START_HOUR)
  const durMin = bookingDurationMinutes(booking)
  const height = Math.max((durMin / 60) * PX_PER_HOUR, 28)

  const timeLine = `${String(booking?.timeSlot || '').trim() || '—'} · ${serviceLabel(booking.serviceType)}`

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen?.(booking)
      }}
      className={`absolute left-1 right-1 z-[5] overflow-hidden rounded-lg px-2 py-1 text-left shadow-sm transition hover:z-[6] hover:shadow-md ${serviceColors(booking.serviceType)} ${statusOverlay(status)}`}
      style={{ top: Math.max(0, top), height }}
    >
      <p className={`truncate font-bold ${compact ? 'text-[11px]' : 'text-xs'} leading-tight`}>{name}</p>
      <p className={`truncate text-[11px] opacity-80 ${compact ? 'hidden sm:block' : ''}`}>{timeLine}</p>
      {status === 'completed' ? <span className="text-[10px] text-green-700">✓</span> : null}
    </button>
  )
}
