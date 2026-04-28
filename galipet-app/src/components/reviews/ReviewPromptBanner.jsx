import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Star } from 'lucide-react'
import { api } from '../../api/client.js'
import { UserContext } from '../../UserContext.jsx'

export default function ReviewPromptBanner() {
  const { user } = useContext(UserContext)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const { data } = await api.get('/api/reviews/pending')
        if (!ignore) setPending(Array.isArray(data?.pending) ? data.pending : [])
      } catch {
        if (!ignore) setPending([])
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [])

  if (loading || !pending.length) return null

  const first = pending[0]
  const role = String(user?.role || '').toLowerCase()
  const subtitle =
    role === 'owner'
      ? `Share your experience with ${first.otherParty?.name || 'your professional'}`
      : `Leave feedback for ${first.otherParty?.name || 'this client'}`

  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <Star className="h-5 w-5 shrink-0 fill-[#E05C2A] text-[#E05C2A]" strokeWidth={0} aria-hidden />
            <span>
              You have {pending.length} review{pending.length !== 1 ? 's' : ''} to write
            </span>
          </p>
          <p className="mt-0.5 text-xs text-amber-800/90">{subtitle}</p>
        </div>
        <Link
          to={`/review/${first.bookingId}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
        >
          Write review
          <ChevronRight className="h-4 w-4 text-[#E05C2A]" strokeWidth={2.25} aria-hidden />
        </Link>
      </div>
    </div>
  )
}
