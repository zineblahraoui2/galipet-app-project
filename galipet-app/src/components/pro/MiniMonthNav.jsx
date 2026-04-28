import { useMemo } from 'react'
import { dateKeyLocal, getMonthGrid } from './calendarUtils.js'

export default function MiniMonthNav({
  anchorDate,
  onAnchorChange,
  bookings,
  onPickDate,
}) {
  const grid = useMemo(() => getMonthGrid(anchorDate), [anchorDate])
  const todayKey = dateKeyLocal(new Date())

  function hasBooking(d) {
    const k = dateKeyLocal(d)
    return bookings.some((b) => dateKeyLocal(b.date) === k)
  }

  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          className="rounded-lg p-1 text-gray-600 hover:bg-gray-100"
          aria-label="Previous month"
          onClick={() => {
            const x = new Date(anchorDate)
            x.setMonth(x.getMonth() - 1)
            onAnchorChange?.(x)
          }}
        >
          ‹
        </button>
        <span className="text-xs font-bold text-gray-800">
          {anchorDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
        </span>
        <button
          type="button"
          className="rounded-lg p-1 text-gray-600 hover:bg-gray-100"
          aria-label="Next month"
          onClick={() => {
            const x = new Date(anchorDate)
            x.setMonth(x.getMonth() + 1)
            onAnchorChange?.(x)
          }}
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-semibold uppercase text-gray-400">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {grid.map((d) => {
          const k = dateKeyLocal(d)
          const inMonth = d.getMonth() === anchorDate.getMonth()
          const isToday = k === todayKey
          return (
            <button
              key={k}
              type="button"
              onClick={() => onPickDate?.(d)}
              className={`relative flex h-7 items-center justify-center rounded text-[11px] font-semibold ${
                inMonth ? 'text-gray-900' : 'text-gray-300'
              } ${isToday ? 'bg-[#E05C2A] text-white' : 'hover:bg-[#FEF3EE]'}`}
            >
              {d.getDate()}
              {hasBooking(d) ? (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#E05C2A]" />
              ) : null}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="mt-3 w-full rounded-lg py-1.5 text-xs font-semibold text-[#E05C2A] hover:bg-[#FEF3EE]"
        onClick={() => onPickDate?.(new Date())}
      >
        Today
      </button>
    </div>
  )
}
