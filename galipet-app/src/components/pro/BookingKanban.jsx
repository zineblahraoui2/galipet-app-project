import BookingCard from './BookingCard.jsx'

const COLUMNS = [
  { status: 'pending', title: 'Pending', headerClass: 'border-yellow-200 bg-yellow-50 text-yellow-900' },
  { status: 'confirmed', title: 'Confirmed', headerClass: 'border-blue-200 bg-blue-50 text-blue-900' },
  { status: 'completed', title: 'Completed', headerClass: 'border-green-200 bg-green-50 text-green-900' },
  { status: 'cancelled', title: 'Cancelled', headerClass: 'border-gray-200 bg-gray-50 text-gray-800' },
]

export default function BookingKanban({ grouped, busyId, onOpenDrawer, onStatusUpdate, onBookingMetaUpdate }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:snap-none">
      {COLUMNS.map(({ status, title, headerClass }) => {
        const list = grouped[status] || []
        return (
          <div
            key={status}
            className="flex w-[min(280px,85vw)] shrink-0 snap-start flex-col rounded-2xl border border-gray-200 bg-[#F6EFE9]/50"
          >
            <div className={`rounded-t-2xl border-b px-3 py-2.5 ${headerClass}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{title}</span>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-gray-800">
                  {list.length}
                </span>
              </div>
            </div>
            <div className="flex max-h-[calc(100vh-220px)] flex-col gap-2 overflow-y-auto p-2">
              {list.map((b) => (
                <BookingCard
                  key={b._id}
                  booking={b}
                  variant="compact"
                  busy={String(busyId) === String(b._id)}
                  onOpenDrawer={onOpenDrawer}
                  onStatusUpdate={onStatusUpdate}
                  onBookingMetaUpdate={onBookingMetaUpdate}
                  userRole="professional"
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
