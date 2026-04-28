import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Clock3,
  Languages,
  MapPin,
  PawPrint,
  Phone,
  ShieldCheck,
  Star,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { api } from '../api/client.js'
import { UserContext } from '../UserContext.jsx'
import BookingModal from '../components/booking/BookingModal.jsx'

const specialtyLabel = {
  vet: 'Veterinarian',
  grooming: 'Groomer',
  sitting: 'Pet Sitter',
  training: 'Trainer',
}

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

function mediaUrl(path) {
  if (!path) return ''
  if (String(path).startsWith('http')) return path
  return `${apiBase}${path}`
}

function scheduleRows(weeklySchedule) {
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  return dayOrder.map((day) => {
    const slot = weeklySchedule?.[day]
    const enabled = Boolean(slot?.enabled)
    return {
      day: day.slice(0, 3).toUpperCase(),
      text: enabled ? `${slot?.start || '09:00'} - ${slot?.end || '18:00'}` : 'Closed',
      enabled,
    }
  })
}

export default function ProfessionalProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(UserContext)
  const [pro, setPro] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)

  useEffect(() => {
    let ignore = false
    window.scrollTo(0, 0)
    ;(async () => {
      setLoading(true)
      try {
        const proRes = await api.get(`/api/professionals/${id}`)
        const professional = proRes?.data?.professional || null
        if (!professional) throw new Error('professional not found')
        let reviewRows = []
        if (professional.userId && user?.id) {
          try {
            const rr = await api.get(`/api/reviews/professional/${professional.userId}`)
            reviewRows = Array.isArray(rr?.data?.reviews) ? rr.data.reviews : []
          } catch {
            reviewRows = []
          }
        }
        if (!ignore) {
          setPro(professional)
          setReviews(reviewRows)
        }
      } catch {
        if (!ignore) {
          setPro(null)
          setReviews([])
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [id, user?.id])

  const avgRating = useMemo(() => {
    if (!reviews.length) return null
    const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0)
    return (sum / reviews.length).toFixed(1)
  }, [reviews])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse px-4 py-8">
        <div className="mb-6 h-5 w-24 rounded bg-gray-200" />
        <div className="mb-6 h-36 rounded-2xl bg-white" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <div className="h-28 rounded-2xl bg-white" />
            <div className="h-64 rounded-2xl bg-white" />
          </div>
          <div className="space-y-4">
            <div className="h-32 rounded-2xl bg-white" />
            <div className="h-48 rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    )
  }

  if (!pro) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="mb-4 inline-flex rounded-full bg-[#FAECE7] p-3 text-[#D85A30]">
          <PawPrint className="h-8 w-8" />
        </p>
        <h2 className="mb-2 text-lg font-semibold text-gray-700">Professional not found</h2>
        <p className="mb-6 text-sm text-gray-400">This profile may have been removed or doesn't exist.</p>
        <button type="button" onClick={() => navigate('/search')} className="rounded-xl bg-[#D85A30] px-6 py-2.5 text-sm font-medium text-white">
          Back to search
        </button>
      </div>
    )
  }

  const canBook = user && String(user.role || '') === 'owner'

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#FAECE7]">
            {pro.avatar ? (
              <img src={mediaUrl(pro.avatar)} alt={pro.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-[#D85A30]">{String(pro.name || 'P')[0].toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{pro.name}</h1>
              {pro.verificationStatus === 'verified' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : null}
            </div>
            <p className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-[#D85A30] capitalize">
              <Stethoscope className="h-4 w-4" />
              {specialtyLabel[pro.specialty] || pro.specialty}
            </p>
            <p className="mb-2 inline-flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="h-4 w-4 text-[#D85A30]" />
              {[pro.location, pro.city].filter(Boolean).join(' · ')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {avgRating ? (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {avgRating}
                  <span className="text-xs font-normal text-gray-400">({reviews.length} reviews)</span>
                </span>
              ) : null}
              {Number(pro.experience || 0) > 0 ? (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                  <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                  {pro.experience} yrs experience
                </span>
              ) : null}
              {pro.languages ? (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Languages className="h-3.5 w-3.5" />
                  {pro.languages}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex min-w-[180px] flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                if (canBook) {
                  setShowBookingModal(true)
                } else {
                  navigate('/login', { state: { from: `/professionals/${id}` } })
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D85A30] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#c44e28]"
            >
              <CalendarClock className="h-4 w-4" />
              Book now
            </button>
            {pro.phone ? (
              <a href={`tel:${pro.phone}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">
                <Phone className="h-3.5 w-3.5" />
                {pro.phone}
              </a>
            ) : null}
            {canBook ? (
              <Link
                to={`/messages?userId=${encodeURIComponent(String(pro.userId || ''))}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 px-4 py-2 text-xs text-[#D85A30] transition-colors hover:bg-[#FAECE7]"
              >
                <UserRound className="h-3.5 w-3.5" />
                Send message
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="order-2 space-y-5 md:order-2 md:col-span-2">
          {pro.description ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-gray-900">About</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">{pro.description}</p>
            </div>
          ) : null}

          {Array.isArray(pro.speciesWorked) && pro.speciesWorked.length > 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-gray-900">I work with</h2>
              <div className="flex flex-wrap gap-2">
                {pro.speciesWorked.map((s) => (
                  <span key={s} className="rounded-full bg-[#FAECE7] px-3 py-1.5 text-sm text-[#D85A30]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {Array.isArray(pro.services) && pro.services.length > 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-gray-900">Services</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {pro.services.map((service) => (
                  <div
                    key={service._id}
                    className="flex items-center justify-between rounded-xl border border-[#F3E8DF] bg-white p-4"
                  >
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">{service.name}</p>
                      {service.duration ? <p className="text-xs text-gray-400">{service.duration} min</p> : null}
                    </div>
                    <span className="font-bold text-[#E05C2A]">{service.price} MAD</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Reviews</h2>
              {avgRating ? (
                <span className="inline-flex items-center gap-1 text-xl font-bold text-amber-500">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  {avgRating}
                </span>
              ) : null}
            </div>
            {!user ? (
              <p className="text-sm text-gray-500">Login to view full reviews.</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review, i) => (
                  <div key={review._id || i} className="border-b border-gray-50 pb-4 last:border-b-0 last:pb-0">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{review.ownerName || 'Anonymous'}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(review.date || review.createdAt || Date.now()).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className="text-sm text-amber-500">{'★'.repeat(Number(review.rating || 0))}</span>
                    </div>
                    {review.comment ? <p className="text-sm leading-relaxed text-gray-600">"{review.comment}"</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="order-1 space-y-4 md:order-1 md:col-span-1">
          {(pro.consultationFee || (pro.homeVisit && pro.homeVisitFee)) ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-semibold text-gray-900">Pricing</h3>
              {pro.consultationFee ? (
                <div className="mb-2 flex items-center justify-between border-b border-gray-50 pb-2 text-sm">
                  <span className="text-gray-500">Consultation</span>
                  <span className="font-semibold text-gray-900">{pro.consultationFee} MAD</span>
                </div>
              ) : null}
              {pro.homeVisit && pro.homeVisitFee ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Home visit</span>
                  <span className="font-semibold text-gray-900">{pro.homeVisitFee} MAD</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {(pro.practiceName || pro.practiceAddress || pro.mapLink) ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-semibold text-gray-900">Practice</h3>
              {pro.practiceName ? <p className="text-sm font-medium text-gray-800">{pro.practiceName}</p> : null}
              {pro.practiceAddress ? <p className="mt-1 text-xs text-gray-500">{pro.practiceAddress}</p> : null}
              {pro.mapLink ? (
                <a href={pro.mapLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-[#D85A30] hover:underline">
                  View on Google Maps
                </a>
              ) : null}
            </div>
          ) : null}

          {pro.weeklySchedule ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-semibold text-gray-900">Availability</h3>
              <div className="space-y-1">
                {scheduleRows(pro.weeklySchedule).map((row) => (
                  <div key={row.day} className="flex items-center justify-between border-b border-gray-50 py-1.5 text-xs last:border-b-0">
                    <span className={row.enabled ? 'font-medium text-gray-700' : 'text-gray-300'}>{row.day}</span>
                    <span className={row.enabled ? 'text-gray-600' : 'text-gray-300'}>{row.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {(pro.licenseNumber || pro.education || pro.certifications) ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 inline-flex items-center gap-1.5 font-semibold text-gray-900">
                <ShieldCheck className="h-4 w-4 text-[#D85A30]" />
                Credentials
              </h3>
              {pro.licenseNumber ? <p className="mb-1.5 text-xs text-gray-600">License: {pro.licenseNumber}</p> : null}
              {pro.education ? <p className="mb-1.5 text-xs text-gray-600">{pro.education}</p> : null}
              {pro.certifications ? <p className="text-xs text-gray-600">{pro.certifications}</p> : null}
            </div>
          ) : null}
        </div>
      </div>

      {showBookingModal ? (
        <BookingModal
          preSelectedPro={pro}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false)
            navigate('/account/bookings', { state: { toast: 'Booking confirmed! We will follow up soon.' } })
          }}
        />
      ) : null}
    </div>
  )
}
