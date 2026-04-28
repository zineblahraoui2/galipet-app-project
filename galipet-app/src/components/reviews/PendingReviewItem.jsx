import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { serviceLabel } from './reviewConfig.js'

export default function PendingReviewItem({ item }) {
  const title = serviceLabel(item.serviceType)
  const date = item.date ? new Date(item.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ''
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100 bg-white/80 px-3 py-2">
      <div>
        <p className="text-sm font-medium text-gray-900">{item.otherParty?.name || 'Other party'}</p>
        <p className="text-xs text-gray-600">
          {title} · {date}
          {item.daysLeft != null ? <span className="ml-1">· {item.daysLeft}d left</span> : null}
        </p>
      </div>
      <Link
        to={`/review/${item.bookingId}`}
        className="inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-[#E05C2A] px-3 py-1.5 text-xs font-semibold text-white"
      >
        Write review
        <ChevronRight className="h-3.5 w-3.5 opacity-95" strokeWidth={2.5} aria-hidden />
      </Link>
    </div>
  )
}
