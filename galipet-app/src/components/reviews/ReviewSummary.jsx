import { Star } from 'lucide-react'
import { CriteriaIcon } from './criteriaIcons.jsx'

export default function ReviewSummary({ summary, compact = false }) {
  if (!summary || !summary.count) {
    return compact ? (
      <p className="text-xs text-gray-500">No reviews yet</p>
    ) : (
      <p className="text-sm text-gray-600">No reviews yet</p>
    )
  }
  const { avgRating, count, recommendPct, criteriaAvg = {} } = summary
  if (compact) {
    return (
      <p className="flex flex-wrap items-center gap-x-1 text-xs text-gray-600">
        <span className="inline-flex items-center gap-0.5 font-semibold text-[#E05C2A]">
          <Star className="h-3.5 w-3.5 fill-[#E05C2A] text-[#E05C2A]" strokeWidth={0} aria-hidden />
          {Number(avgRating).toFixed(1)}
        </span>
        <span className="mx-1">·</span>
        {count} review{count !== 1 ? 's' : ''}
        {recommendPct != null ? (
          <span className="ml-1 text-gray-500">· Would recommend {recommendPct}%</span>
        ) : null}
      </p>
    )
  }
  return (
    <div className="rounded-2xl border border-[#EADFD6] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="inline-flex items-center gap-1 text-2xl font-bold text-[#E05C2A]">
          <Star className="h-7 w-7 fill-[#E05C2A] text-[#E05C2A]" strokeWidth={0} aria-hidden />
          {Number(avgRating).toFixed(1)}
        </span>
        <span className="text-sm text-gray-600">
          ({count} review{count !== 1 ? 's' : ''})
        </span>
        {recommendPct != null ? (
          <span
            className={[
              'ml-auto rounded-full px-2 py-0.5 text-xs font-semibold',
              recommendPct >= 80 ? 'bg-green-100 text-green-800 ring-1 ring-green-200' : 'bg-green-50 text-green-700',
            ].join(' ')}
          >
            {recommendPct >= 80 ? 'Highly recommended · ' : ''}
            Would recommend: {recommendPct}%
          </span>
        ) : null}
      </div>
      <div className="mt-4 space-y-2">
        {['expertise', 'punctuality', 'communication', 'value'].map((k) => {
          const n = Number(criteriaAvg[k] || 0)
          const pct = Math.min(100, (n / 5) * 100)
          const label = k.charAt(0).toUpperCase() + k.slice(1)
          return (
            <div key={k} className="flex items-center gap-3 text-sm">
              <span className="flex w-28 shrink-0 items-center gap-2 capitalize text-gray-600">
                <CriteriaIcon criterionKey={k} className="!h-3.5 !w-3.5" />
                {label}
              </span>
              <div className="h-2 min-w-0 flex-1 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-[#E05C2A]" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right font-medium text-gray-800">{n ? n.toFixed(1) : '—'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
