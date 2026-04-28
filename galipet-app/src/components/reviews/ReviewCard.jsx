import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, ThumbsDown, ThumbsUp } from 'lucide-react'
import { serviceLabel } from './reviewConfig.js'
import StarRating from './StarRating.jsx'
import ProResponseForm from './ProResponseForm.jsx'

function avatarColor(name) {
  const s = String(name || 'U')
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (h + s.charCodeAt(i) * 13) % 360
  return `hsl(${h} 55% 42%)`
}

function initials(name) {
  const p = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!p.length) return '?'
  return p
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() || '')
    .join('')
}

export default function ReviewCard({
  review,
  variant = 'ownerToPro',
  showResponseForm = false,
  proDisplayName = 'Professional',
  onReviewPosted,
}) {
  const [open, setOpen] = useState(Boolean(review.proResponse))
  const [localResponse, setLocalResponse] = useState(review.proResponse || '')
  const isOwner = variant === 'ownerToPro'

  useEffect(() => {
    setLocalResponse(review.proResponse || '')
    setOpen(Boolean(review.proResponse))
  }, [review.proResponse, review._id])
  const name = isOwner ? review.ownerName : review.proName
  const rating = isOwner ? review.rating : review.rating
  const comment = review.comment || ''
  const tags = review.tags || []
  const date = review.date ? new Date(review.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''
  const service = serviceLabel(review.serviceType)
  const pet = review.petName || 'Pet'

  return (
    <article className="rounded-2xl border border-[#EADFD6] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: avatarColor(name) }}
        >
          {initials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate font-semibold text-gray-900">{name}</p>
            <div className="flex shrink-0 items-center gap-1">
              <StarRating value={rating} readonly size="sm" />
              <span className="text-xs text-gray-500">{date}</span>
            </div>
          </div>
          <p className="mt-0.5 text-xs text-gray-600">
            {service} · {pet}
          </p>
          {comment ? <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">&ldquo;{comment}&rdquo;</p> : null}
          {tags.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((t) => (
                <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {String(t).replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          ) : null}
          {isOwner && review.wouldBookAgain === true ? (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              <ThumbsUp className="h-3.5 w-3.5 shrink-0 text-green-700" strokeWidth={2.25} aria-hidden />
              Would book again
            </p>
          ) : null}
          {isOwner && review.wouldBookAgain === false ? (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
              <ThumbsDown className="h-3.5 w-3.5 shrink-0 text-gray-500" strokeWidth={2.25} aria-hidden />
              Not for now
            </p>
          ) : null}
          {!isOwner && review.wouldAcceptAgain === true ? (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              <ThumbsUp className="h-3.5 w-3.5 shrink-0 text-green-700" strokeWidth={2.25} aria-hidden />
              Would accept again
            </p>
          ) : null}
          {!isOwner && review.wouldAcceptAgain === false ? (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
              <ThumbsDown className="h-3.5 w-3.5 shrink-0 text-gray-500" strokeWidth={2.25} aria-hidden />
              Would not accept again
            </p>
          ) : null}
          {isOwner && (localResponse || showResponseForm) ? (
            <div className="mt-3">
              {localResponse ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#E05C2A] underline"
                  >
                    {open ? 'Hide response' : 'Pro response'}
                    {open ? (
                      <ChevronUp className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
                    )}
                  </button>
                  {open ? (
                    <blockquote className="mt-2 border-l-4 border-gray-200 bg-gray-50 px-3 py-2 text-sm italic text-gray-700">
                      <span className="font-medium not-italic text-gray-600">Response from {proDisplayName}:</span>{' '}
                      {localResponse}
                    </blockquote>
                  ) : null}
                </>
              ) : null}
              {showResponseForm && !localResponse ? (
                <ProResponseForm
                  bookingId={String(review.bookingId?._id || review.bookingId || '')}
                  onPosted={(text) => {
                    setLocalResponse(text || '')
                    setOpen(true)
                    onReviewPosted?.()
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
