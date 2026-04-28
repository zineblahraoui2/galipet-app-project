import { FaUser } from 'react-icons/fa'

function statusClasses(status) {
  if (status === 'confirmed') return 'bg-green-100 text-green-700'
  if (status === 'completed') return 'bg-gray-100 text-gray-700'
  if (status === 'cancelled') return 'bg-red-100 text-red-700'
  return 'bg-amber-100 text-amber-700'
}

export default function RequestItem({
  clientName,
  petLine,
  status,
  onAccept,
  onReject,
  busy,
}) {
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-2 truncate font-semibold text-gray-900">
          <FaUser className="h-3.5 w-3.5 shrink-0 text-[#E05C2A]" aria-hidden />
          <span className="truncate">{clientName}</span>
        </p>
        <p className="truncate text-sm text-gray-600">{petLine}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(status)}`}>
          {status}
        </span>
        {onAccept && onReject ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onAccept}
              className="rounded-xl border border-[#E05C2A] bg-[#E05C2A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#c94f24] disabled:opacity-50"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        ) : null}
      </div>
    </li>
  )
}
