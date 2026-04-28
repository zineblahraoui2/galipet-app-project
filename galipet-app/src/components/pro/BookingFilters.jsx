const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'late', label: 'Late' },
  { id: 'rescheduled', label: 'Rescheduled' },
  { id: 'no_show', label: 'No-show' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

export default function BookingFilters({
  activeFilter,
  onFilterChange,
  search,
  onSearchChange,
  counts,
}) {
  return (
    <div className="space-y-3">
      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-min gap-2 px-1">
          {FILTERS.map(({ id, label }) => {
            const active = activeFilter === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onFilterChange(id)}
                className={[
                  'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
                  active
                    ? 'bg-[#E05C2A] text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-[#E05C2A]/40',
                ].join(' ')}
              >
                {label}
                {id !== 'all' && counts[id] > 0 ? ` ${counts[id]}` : ''}
              </button>
            )
          })}
        </div>
      </div>
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by client or service..."
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#E05C2A] focus:ring-2 focus:ring-[#E05C2A]/20"
      />
    </div>
  )
}
