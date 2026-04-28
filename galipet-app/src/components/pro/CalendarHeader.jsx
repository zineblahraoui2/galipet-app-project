export default function CalendarHeader({
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  isAway,
  onToggleAway,
  onOpenScheduleMobile,
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Calendar</h1>
          <p className="text-sm text-gray-600">Manage availability and bookings</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleAway}
            className={[
              'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition',
              isAway
                ? 'border-orange-200 bg-orange-50 text-orange-900'
                : 'border-green-200 bg-green-50 text-green-900',
            ].join(' ')}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${isAway ? 'bg-orange-500' : 'bg-green-500'}`} />
            {isAway ? 'Away' : 'Active'}
            <span className="text-gray-400">▾</span>
          </button>
          <button
            type="button"
            className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm md:hidden"
            onClick={onOpenScheduleMobile}
            aria-label="Schedule"
          >
            ⚙ Schedule
          </button>
          <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
            {['week', 'month', 'day'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onViewChange(v)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize sm:px-4 sm:text-sm ${
                  view === v ? 'bg-[#E05C2A] text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className="rounded-lg border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50" onClick={onPrev}>
              ‹
            </button>
            <button type="button" className="rounded-lg border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50" onClick={onNext}>
              ›
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-medium hover:bg-gray-50"
              onClick={onToday}
            >
              Today
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
