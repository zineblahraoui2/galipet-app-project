import { dateKeyLocal, getBookingsForDay } from './calendarUtils.js'

const STRIPES = 'repeating-linear-gradient(45deg, #e5e7eb 0px, #e5e7eb 1px, #ffffff 1px, #ffffff 8px)'

function isSameMonth(d, anchor) {
  return d.getMonth() === anchor.getMonth() && d.getFullYear() === anchor.getFullYear()
}

export default function MonthView({ monthAnchor, gridDays, bookings, dailyCapacity, blockedDates, onPickDay }) {
  const todayKey = dateKeyLocal(new Date())
  return (
    <div className="grid grid-cols-7 gap-px rounded-2xl border border-gray-100 bg-gray-100 shadow-sm">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w) => (
        <div key={w} className="bg-gray-50 py-2 text-center text-[10px] font-bold uppercase text-gray-500">
          {w}
        </div>
      ))}
      {gridDays.map((day) => {
        const inMonth = isSameMonth(day, monthAnchor)
        const key = dateKeyLocal(day)
        const list = getBookingsForDay(bookings, day)
        const active = list.filter((b) => ['pending', 'confirmed', 'completed'].includes(String(b.status || '')))
        const full = active.length >= dailyCapacity
        const blocked = blockedDates?.includes(key)
        const isToday = key === todayKey

        return (
          <button
            key={key}
            type="button"
            onClick={() => onPickDay?.(day)}
            className={`flex min-h-[100px] flex-col items-stretch border border-white bg-white p-1.5 text-left transition hover:bg-[#FEF3EE]/50 sm:p-2 ${
              !inMonth ? 'opacity-40' : ''
            } ${isToday ? 'ring-1 ring-[#E05C2A]/40' : ''}`}
            style={blocked ? { backgroundImage: STRIPES } : undefined}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                isToday ? 'bg-[#E05C2A] text-white' : 'text-gray-800'
              }`}
            >
              {day.getDate()}
            </span>
            <div className="mt-1 flex flex-1 flex-col gap-0.5 overflow-hidden">
              {list.slice(0, 3).map((b) => (
                <span
                  key={b._id}
                  className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                    String(b.serviceType) === 'vet'
                      ? 'bg-blue-100 text-blue-800'
                      : String(b.serviceType) === 'grooming'
                        ? 'bg-purple-100 text-purple-800'
                        : String(b.serviceType) === 'sitting'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {(b.timeSlot || '').toString().split('-')[0].trim() || '—'} · {b.user?.name || 'Client'}
                </span>
              ))}
              {list.length > 3 ? (
                <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-600">
                  +{list.length - 3} more
                </span>
              ) : null}
            </div>
            <div className="mt-auto flex justify-end pt-1">
              {full ? (
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-700">Full</span>
              ) : (
                <span className="text-[9px] text-gray-500">
                  {active.length}/{dailyCapacity}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
