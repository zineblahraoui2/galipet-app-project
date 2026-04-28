import { FaClock, FaPaw } from 'react-icons/fa'

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'GP'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function statusLabel(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'no_show') return 'No-show'
  return s || ''
}

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'confirmed') return 'bg-green-100 text-green-700'
  if (s === 'completed') return 'bg-gray-100 text-gray-700'
  if (s === 'cancelled') return 'bg-red-100 text-red-700'
  if (s === 'late') return 'bg-orange-100 text-orange-800'
  if (s === 'no_show') return 'bg-red-100 text-red-800'
  if (s === 'rescheduled') return 'bg-sky-100 text-sky-800'
  return 'bg-amber-100 text-amber-700'
}

export default function AppointmentItem({ clientName, petName, serviceLabel, time, status }) {
  const petPart = petName ? `${petName} · ${serviceLabel}` : serviceLabel
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="flex w-14 shrink-0 flex-col items-center gap-0.5 pt-0.5">
        <FaClock className="h-3.5 w-3.5 text-[#E05C2A]" aria-hidden />
        <p className="text-center text-sm font-semibold tabular-nums text-[#E05C2A]">{time}</p>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FAECE7] text-sm font-semibold text-[#E05C2A]">
        {initials(clientName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900">{clientName}</p>
        <p className="flex min-w-0 items-center gap-1.5 truncate text-sm text-gray-600">
          <FaPaw className="h-3.5 w-3.5 shrink-0 text-[#E05C2A]" aria-hidden />
          <span className="truncate">{petPart}</span>
        </p>
      </div>
      {status ? (
        <span
          className={`shrink-0 self-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadgeClass(status)}`}
        >
          {statusLabel(status)}
        </span>
      ) : null}
    </li>
  )
}
