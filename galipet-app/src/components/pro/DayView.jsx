import BookingCard from './BookingCard.jsx'
import BookingEvent from './BookingEvent.jsx'
import {
  buildDayScheduleVisual,
  dateKeyLocal,
  getBookingsForDay,
  GRID_END_HOUR,
  GRID_HEIGHT_PX,
  GRID_START_HOUR,
  PX_PER_HOUR,
} from './calendarUtils.js'
import { SERVICE_PRICE_MAD } from './bookingUtils.js'

const STRIPES = 'repeating-linear-gradient(45deg, #e5e7eb 0px, #e5e7eb 1px, #ffffff 1px, #ffffff 8px)'

function layerBg(kind) {
  if (kind === 'blocked') return STRIPES
  if (kind === 'off' || kind === 'unavail') return '#F3F0EC'
  return '#ffffff'
}

export default function DayView({
  day,
  bookings,
  weeklySchedule,
  blockedDates,
  dailyCapacity,
  isAway,
  onOpenBooking,
  onStatusUpdate,
  busyId,
  onBlockDay,
}) {
  const hours = []
  for (let hr = GRID_START_HOUR; hr < GRID_END_HOUR; hr += 1) {
    hours.push(`${String(hr).padStart(2, '0')}:00`)
  }
  const key = dateKeyLocal(day)
  const { layers, breakBand } = buildDayScheduleVisual(day, weeklySchedule, blockedDates)
  const dayBookings = getBookingsForDay(bookings, day).sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  )
  const activeCount = dayBookings.filter((b) =>
    ['pending', 'confirmed'].includes(String(b.status || '').toLowerCase()),
  ).length
  const remaining = Math.max(0, dailyCapacity - activeCount)
  const rev = dayBookings
    .filter((b) => String(b.status) === 'completed')
    .reduce((s, b) => s + (SERVICE_PRICE_MAD[String(b.serviceType || '').toLowerCase()] ?? 0), 0)

  return (
    <div className={`flex flex-col gap-4 lg:flex-row ${isAway ? 'opacity-70' : ''}`}>
      <div className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">
            {day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
        </div>
        <div className="flex">
          <div className="w-[52px] shrink-0 border-r border-gray-100 bg-white pt-10" style={{ height: GRID_HEIGHT_PX + 40 }}>
            {hours.map((label) => (
              <div
                key={label}
                className="flex items-start justify-end pr-2 text-[10px] font-medium text-gray-400"
                style={{ height: PX_PER_HOUR }}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="relative min-w-0 flex-1" style={{ height: GRID_HEIGHT_PX }}>
            {layers.map((L, i) => (
              <div
                key={`dl-${i}`}
                className="absolute left-0 right-0"
                style={
                  L.kind === 'blocked'
                    ? { top: L.top, height: L.height, backgroundImage: STRIPES }
                    : { top: L.top, height: L.height, backgroundColor: layerBg(L.kind) }
                }
              />
            ))}
            {breakBand ? (
              <div
                className="pointer-events-none absolute left-0 right-0 z-[2] flex items-center justify-center bg-[#FEFCE8]/90 text-xs font-medium text-yellow-800"
                style={{ top: breakBand.top, height: breakBand.height }}
              >
                Lunch
              </div>
            ) : null}
            {hours.map((_, hi) => (
              <div
                key={`dh-${hi}`}
                className="pointer-events-none absolute left-0 right-0 border-t border-gray-100"
                style={{ top: hi * PX_PER_HOUR }}
              />
            ))}
            {dayBookings.map((b) => (
              <BookingEvent key={b._id} booking={b} onOpen={onOpenBooking} />
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-100 p-4">
          {dayBookings.length === 0 ? (
            <p className="text-center text-sm text-gray-500">No bookings this day</p>
          ) : (
            dayBookings.map((b) => (
              <BookingCard
                key={`list-${b._id}`}
                booking={b}
                variant="list"
                busy={String(busyId) === String(b._id)}
                onOpenDrawer={onOpenBooking}
                onStatusUpdate={onStatusUpdate}
              />
            ))
          )}
        </div>
      </div>

      <aside className="w-full shrink-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:w-[240px]">
        <h3 className="text-sm font-bold text-gray-900">Day summary</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li>
            <span className="text-gray-500">Total bookings:</span> {dayBookings.length}
          </li>
          <li>
            <span className="text-gray-500">Slots left:</span> {remaining}
          </li>
          <li>
            <span className="text-gray-500">Revenue est.:</span>{' '}
            {rev.toLocaleString('fr-FR').replace(/\u202f/g, ' ')} MAD
          </li>
        </ul>
        <button
          type="button"
          onClick={() => onBlockDay?.(key)}
          className="mt-4 w-full rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          + Block this day
        </button>
      </aside>
    </div>
  )
}
