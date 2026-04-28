import { useEffect, useMemo, useState } from 'react'
import BookingEvent from './BookingEvent.jsx'
import CapacityRing from './CapacityRing.jsx'
import { SERVICE_PRICE_MAD } from './bookingUtils.js'
import {
  buildDayScheduleVisual,
  dateKeyLocal,
  getBookingsForDay,
  getDayCapacityPercent,
  GRID_END_HOUR,
  GRID_HEIGHT_PX,
  GRID_START_HOUR,
  PX_PER_HOUR,
} from './calendarUtils.js'

const STRIPES = 'repeating-linear-gradient(45deg, #e5e7eb 0px, #e5e7eb 1px, #ffffff 1px, #ffffff 8px)'

function layerClass(kind) {
  if (kind === 'blocked') return STRIPES
  if (kind === 'off' || kind === 'unavail') return '#F3F0EC'
  return '#ffffff'
}

function isSameDay(a, b) {
  return dateKeyLocal(a) === dateKeyLocal(b)
}

export default function WeekView({
  weekDays,
  bookings,
  weeklySchedule,
  blockedDates,
  dailyCapacity,
  isAway,
  onOpenBooking,
}) {
  const [tick, setTick] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const hours = useMemo(() => {
    const h = []
    for (let hr = GRID_START_HOUR; hr < GRID_END_HOUR; hr += 1) {
      h.push(`${String(hr).padStart(2, '0')}:00`)
    }
    return h
  }, [])

  const weekBookings = useMemo(() => {
    const set = new Set(weekDays.map((d) => dateKeyLocal(d)))
    return bookings.filter((b) => set.has(dateKeyLocal(b.date)))
  }, [bookings, weekDays])

  const glance = useMemo(() => {
    const list = weekBookings
    const rev = list
      .filter((b) => String(b.status) === 'completed')
      .reduce((s, b) => s + (SERVICE_PRICE_MAD[String(b.serviceType || '').toLowerCase()] ?? 0), 0)
    const byDay = weekDays.map((d) => ({ d, n: getBookingsForDay(weekBookings, d).length }))
    const busiest = byDay.reduce((a, b) => (b.n > a.n ? b : a), byDay[0] || { d: weekDays[0], n: 0 })
    const busiestLabel = busiest?.d
      ? busiest.d.toLocaleDateString('en-GB', { weekday: 'long' })
      : '—'
    return { count: list.length, revenue: rev, busiestLabel }
  }, [weekBookings, weekDays])

  const now = new Date(tick)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowTop = ((nowMin - GRID_START_HOUR * 60) / 60) * PX_PER_HOUR

  return (
    <div className={`flex flex-col ${isAway ? 'opacity-70' : ''}`}>
      <div className="mb-3 rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm sm:text-sm">
        <span className="font-semibold text-gray-900">This week:</span>{' '}
        {glance.count} bookings · Revenue est.:{' '}
        {glance.revenue.toLocaleString('fr-FR').replace(/\u202f/g, ' ')} MAD · Busiest: {glance.busiestLabel}
      </div>

      <div className="flex min-h-0 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div
          className="sticky left-0 z-30 w-[52px] shrink-0 border-r border-gray-100 bg-white pt-10"
          style={{ height: GRID_HEIGHT_PX + 40 }}
        >
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

        <div className="flex min-w-0 flex-1 snap-x snap-mandatory overflow-x-auto">
          {weekDays.map((day) => {
            const key = dateKeyLocal(day)
            const today = isSameDay(day, new Date())
            const { layers, breakBand } = buildDayScheduleVisual(day, weeklySchedule, blockedDates)
            const dayBookings = getBookingsForDay(bookings, day).filter((b) =>
              ['pending', 'confirmed', 'completed', 'cancelled'].includes(String(b?.status || '').toLowerCase()),
            )
            const cap = getDayCapacityPercent(bookings, day, dailyCapacity)
            const full = dayBookings.filter((b) => ['pending', 'confirmed'].includes(String(b.status))).length >= dailyCapacity

            return (
              <div
                key={key}
                className="relative min-w-[min(110px,85vw)] flex-1 snap-start border-l border-gray-100 first:border-l-0"
              >
                <div
                  className={`sticky top-0 z-20 flex flex-col items-center border-b border-gray-100 bg-white px-1 py-2 text-center ${
                    today ? 'bg-[#FEF3EE]' : ''
                  } ${full ? 'bg-orange-50/80' : ''}`}
                >
                  <span className="text-[10px] font-semibold uppercase text-gray-500">
                    {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                  </span>
                  <span
                    className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      today ? 'bg-[#E05C2A] text-white' : 'text-gray-900'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="mt-1 flex items-center gap-0.5">
                    <CapacityRing percent={cap} size={18} stroke={2.5} />
                  </div>
                  <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                    {dayBookings.slice(0, 4).map((b) => (
                      <span
                        key={b._id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          String(b.serviceType) === 'vet'
                            ? 'bg-blue-500'
                            : String(b.serviceType) === 'grooming'
                              ? 'bg-purple-500'
                              : String(b.serviceType) === 'sitting'
                                ? 'bg-green-500'
                                : 'bg-orange-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative" style={{ height: GRID_HEIGHT_PX }}>
                  {layers.map((L, i) => (
                    <div
                      key={`${key}-l-${i}`}
                      className="absolute left-0 right-0"
                      style={
                        L.kind === 'blocked'
                          ? {
                              top: L.top,
                              height: L.height,
                              backgroundImage: STRIPES,
                            }
                          : {
                              top: L.top,
                              height: L.height,
                              backgroundColor: layerClass(L.kind),
                            }
                      }
                    />
                  ))}
                  {breakBand ? (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-[2] flex items-center justify-center bg-[#FEFCE8]/90 text-[10px] font-medium text-yellow-800"
                      style={{ top: breakBand.top, height: breakBand.height }}
                    >
                      Lunch
                    </div>
                  ) : null}

                  {hours.map((_, hi) => (
                    <div
                      key={`${key}-h-${hi}`}
                      className="pointer-events-none absolute left-0 right-0 border-t border-gray-100"
                      style={{ top: hi * PX_PER_HOUR }}
                    />
                  ))}

                  {dayBookings.map((b) => (
                    <BookingEvent key={b._id} booking={b} onOpen={onOpenBooking} />
                  ))}

                  {today && nowTop >= 0 && nowTop <= GRID_HEIGHT_PX && nowMin >= GRID_START_HOUR * 60 && nowMin <= GRID_END_HOUR * 60 ? (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-[15] flex items-center"
                      style={{ top: nowTop }}
                    >
                      <span className="mr-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                      <div className="h-px flex-1 bg-red-500" />
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
