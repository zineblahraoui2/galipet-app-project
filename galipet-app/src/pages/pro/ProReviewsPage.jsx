import { useCallback, useContext, useEffect, useState } from 'react'
import { UserContext } from '../../UserContext.jsx'
import { api } from '../../api/client.js'
import ReviewSummary from '../../components/reviews/ReviewSummary.jsx'
import ReviewList from '../../components/reviews/ReviewList.jsx'
import ReviewPromptBanner from '../../components/reviews/ReviewPromptBanner.jsx'

export default function ProReviewsPage() {
  const { user, ready } = useContext(UserContext)
  const [summary, setSummary] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const uid = user?.id
    if (!uid) return
    setLoading(true)
    setErr('')
    try {
      const { data } = await api.get(`/api/reviews/professional/${uid}`)
      setSummary(data?.summary || null)
      setReviews(Array.isArray(data?.reviews) ? data.reviews : [])
    } catch (e) {
      setSummary(null)
      setReviews([])
      setErr(e?.response?.data?.error || 'Could not load reviews.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (ready && user?.id) load()
  }, [ready, user?.id, load])

  const proDisplayName = user?.name?.trim() || 'You'

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <ReviewPromptBanner />
      <div className="rounded-2xl border border-[#EADFD6] bg-[#F6EFE9] p-5 sm:p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Your reviews</h1>
        <p className="mt-1 text-sm text-gray-600">What pet owners say after completed bookings (shown after the review window).</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
      ) : (
        <>
          <ReviewSummary summary={summary} />
          <div id="pro-reviews-list">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">All reviews</h2>
            <ReviewList
              reviews={reviews}
              variant="ownerToPro"
              showResponseForm
              proDisplayName={proDisplayName}
              onReviewPosted={load}
            />
          </div>
        </>
      )}
    </div>
  )
}
