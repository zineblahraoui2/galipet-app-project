export default function StatsBar({ total, pending, thisWeek, revenueMad }) {
  const items = [
    { label: 'Total', value: total },
    { label: 'Pending', value: pending },
    { label: 'This week', value: thisWeek },
    { label: 'Revenue est.', value: `${revenueMad.toLocaleString('fr-FR').replace(/\u202f/g, ' ')} MAD` },
  ]
  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm sm:px-4 sm:text-sm"
        >
          <span className="font-medium text-gray-500">{label}:</span>{' '}
          <span className="font-semibold text-gray-900">{value}</span>
        </div>
      ))}
    </div>
  )
}
