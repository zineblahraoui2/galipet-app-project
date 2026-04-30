import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { api } from '../api/client.js'
import { UserContext } from '../UserContext.jsx'
import StarRating from '../components/reviews/StarRating.jsx'
import CriteriaRating from '../components/reviews/CriteriaRating.jsx'
import TagSelector from '../components/reviews/TagSelector.jsx'
import { OWNER_REVIEW_TAGS, PRO_REVIEW_TAGS, serviceLabel } from '../components/reviews/reviewConfig.js'

export default function ReviewPage() {
  const { bookingId } = useParams()
  const { user, ready } = useContext(UserContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [bookingCtx, setBookingCtx] = useState(null)
  const [reviewMeta, setReviewMeta] = useState(null)

  const [rating, setRating] = useState(0)
  const [criteria, setCriteria] = useState({
    expertise: 0,
    punctuality: 0,
    communication: 0,
    value: 0,
  })
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [wouldBookAgain, setWouldBookAgain] = useState(null)
  const [wouldAcceptAgain, setWouldAcceptAgain] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const role = String(user?.role || '').toLowerCase()
  const isOwner = role === 'owner'
  const isPro = role === 'professional'

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setErr('')
      try {
        const { data } = await api.get(`/api/reviews/booking/${bookingId}`)
        if (ignore) return
        setBookingCtx(data?.booking || null)
        setReviewMeta(data?.review || null)
      } catch (e) {
        if (!ignore) {
          setBookingCtx(null)
          setReviewMeta(null)
          setErr(e?.response?.data?.error || 'Could not load this booking.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    if (bookingId) load()
    return () => {
      ignore = true
    }
  }, [bookingId])

  const alreadyDone = useMemo(() => {
    if (!reviewMeta) return false
    if (isOwner && reviewMeta.ownerSubmitted) return true
    if (isPro && reviewMeta.proSubmitted) return true
    return false
  }, [reviewMeta, isOwner, isPro])

  function toggleTag(value, on) {
    setSelectedTags((prev) => {
      const s = new Set(prev)
      if (on) s.add(value)
      else s.delete(value)
      return [...s]
    })
  }

  async function submit() {
    if (!rating || submitting) return
    if (isOwner && (wouldBookAgain !== true && wouldBookAgain !== false)) return
    if (isPro && (wouldAcceptAgain !== true && wouldAcceptAgain !== false)) return

    setSubmitting(true)
    setErr('')
    try {
      if (isOwner) {
        const crit = {}
        for (const [k, v] of Object.entries(criteria)) {
          if (v >= 1 && v <= 5) crit[k] = v
        }
        await api.post(`/api/reviews/${bookingId}/owner`, {
          rating,
          comment,
          criteria: crit,
          tags: selectedTags,
          wouldBookAgain,
        })
        navigate('/home', { replace: false, state: { toast: 'Review submitted! Thank you 🐾' } })
      } else if (isPro) {
        await api.post(`/api/reviews/${bookingId}/pro`, {
          rating,
          comment,
          tags: selectedTags,
          wouldAcceptAgain,
        })
        navigate('/pro/dashboard', { replace: false, state: { toast: 'Feedback submitted! Thank you 🐾' } })
      }
    } catch (e) {
      setErr(e?.response?.data?.error || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) {
    return <p className="mt-10 text-center text-sm text-gray-500">Loading…</p>
  }
  if (!user) {
    return <Navigate to="/" replace />
  }
  if (!isOwner && !isPro) {
    return <Navigate to="/" replace />
  }

  const proName = bookingCtx?.proName || 'your professional'
  const ownerName = bookingCtx?.ownerName || 'the pet owner'
  const petName = bookingCtx?.petName || 'Pet'
  const svc = serviceLabel(bookingCtx?.serviceType)
  const dateStr = bookingCtx?.date
    ? new Date(bookingCtx.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : ''

  return (
    <div className="min-h-screen bg-[#F6EFE9] pb-28 pt-6 sm:pb-8">
      <div className="mx-auto max-w-lg px-4">
        <Link to={isOwner ? '/home' : '/pro/dashboard'} className="text-sm font-medium text-[#E05C2A] underline">
          ← Back
        </Link>

        {loading ? (
          <p className="mt-8 text-center text-sm text-gray-600">Loading…</p>
        ) : err ? (
          <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>
        ) : alreadyDone ? (
          <div className="mt-8 rounded-2xl border border-[#EADFD6] bg-white p-6 text-center shadow-sm">
            <p className="font-semibold text-gray-900">You already submitted this review.</p>
            <Link
              to={isOwner ? '/home' : '/pro/dashboard'}
              className="mt-4 inline-block rounded-lg bg-[#E05C2A] px-4 py-2 text-sm font-semibold text-white"
            >
              Continue
            </Link>
          </div>
        ) : (
          <>
            <header className="mt-6">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {isOwner ? (
                  <>How was your experience with {proName}?</>
                ) : (
                  <>Leave feedback about {ownerName} and their pet</>
                )}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {svc} · {dateStr} · {petName}
              </p>
            </header>

            <div className="mt-8 space-y-8 rounded-2xl border border-[#EADFD6] bg-white p-5 shadow-sm sm:p-6">
              <section>
                <p className="text-sm font-semibold text-gray-800">Overall rating</p>
                <p className="mt-1 text-xs text-gray-500">Required · 1 = Poor · 5 = Excellent</p>
                <div className="mt-3 flex justify-center sm:justify-start">
                  <StarRating value={rating} onChange={setRating} size="lg" />
                </div>
              </section>

              {isOwner ? (
                <section>
                  <p className="text-sm font-semibold text-gray-800">Rate by criteria (optional)</p>
                  <p className="mt-1 text-xs text-gray-500">Helps other pet owners choose with confidence.</p>
                  <div className="mt-4">
                    <CriteriaRating value={criteria} onChange={setCriteria} />
                  </div>
                </section>
              ) : null}

              <section>
                <p className="text-sm font-semibold text-gray-800">{isOwner ? 'What stood out?' : 'How was this client?'}</p>
                <div className="mt-3">
                  <TagSelector
                    options={isOwner ? OWNER_REVIEW_TAGS : PRO_REVIEW_TAGS}
                    selected={selectedTags}
                    onToggle={toggleTag}
                  />
                </div>
              </section>

              <section>
                <label className="text-sm font-semibold text-gray-800" htmlFor="review-comment">
                  {isOwner ? 'Written review (optional)' : 'Comment (optional)'}
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(isOwner ? e.target.value.slice(0, 1000) : e.target.value.slice(0, 500))}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E05C2A]"
                  placeholder={
                    isOwner
                      ? 'Tell future pet owners what to expect…'
                      : 'Share feedback about this client for other professionals…'
                  }
                />
                {isOwner ? <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/1000</p> : null}
              </section>

              <section>
                <p className="text-sm font-semibold text-gray-800">
                  {isOwner ? 'Would you book again?' : 'Would you accept again?'}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => (isOwner ? setWouldBookAgain(true) : setWouldAcceptAgain(true))}
                    className={[
                      'flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition',
                      (isOwner ? wouldBookAgain === true : wouldAcceptAgain === true)
                        ? 'border-green-600 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                    ].join(' ')}
                  >
                    <ThumbsUp
                      className={[
                        'h-5 w-5 shrink-0',
                        (isOwner ? wouldBookAgain === true : wouldAcceptAgain === true) ? 'text-green-700' : 'text-gray-500',
                      ].join(' ')}
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    {isOwner ? 'Yes, definitely' : 'Yes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => (isOwner ? setWouldBookAgain(false) : setWouldAcceptAgain(false))}
                    className={[
                      'flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition',
                      (isOwner ? wouldBookAgain === false : wouldAcceptAgain === false)
                        ? 'border-gray-400 bg-gray-50 text-gray-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                    ].join(' ')}
                  >
                    <ThumbsDown
                      className={[
                        'h-5 w-5 shrink-0',
                        (isOwner ? wouldBookAgain === false : wouldAcceptAgain === false)
                          ? 'text-gray-600'
                          : 'text-gray-500',
                      ].join(' ')}
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    {isOwner ? 'Not for now' : 'No'}
                  </button>
                </div>
              </section>
            </div>

            {err ? <p className="mt-4 text-center text-sm text-red-600">{err}</p> : null}

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#EADFD6] bg-[#F6EFE9]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              <button
                type="button"
                disabled={
                  submitting ||
                  !rating ||
                  (isOwner && wouldBookAgain !== true && wouldBookAgain !== false) ||
                  (isPro && wouldAcceptAgain !== true && wouldAcceptAgain !== false)
                }
                onClick={submit}
                className="w-full rounded-xl bg-[#E05C2A] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#c94e22] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : isOwner ? 'Submit review' : 'Submit feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
