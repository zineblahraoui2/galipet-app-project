import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BadgeCheck, GraduationCap, Home, MapPin, Scissors, Star, Stethoscope } from 'lucide-react'
import { api } from '../api/client.js'
import { UserContext } from '../UserContext.jsx'
import MapboxMap from '../components/MapboxMap.jsx'
import BookingModal from '../components/booking/BookingModal.jsx'
import ReviewSummary from '../components/reviews/ReviewSummary.jsx'
import ReviewList from '../components/reviews/ReviewList.jsx'

const SERVICE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'vet', label: 'Vets' },
  { value: 'grooming', label: 'Groomers' },
  { value: 'sitting', label: 'Sitters' },
  { value: 'training', label: 'Trainers' },
]

const MIN_RATING_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: '4.5', label: '4.5+' },
  { value: '4.0', label: '4.0+' },
]

const SORT_OPTIONS = [
  { value: 'rating', label: 'Rating' },
  { value: 'distance', label: 'Distance' },
  { value: 'price', label: 'Price' },
]

const specialtyIcon = {
  vet: Stethoscope,
  grooming: Scissors,
  sitting: Home,
  training: GraduationCap,
}

/** Linked User document id for messaging — never use Professional `._id` here. */
function professionalAccountUserId(pro) {
  if (pro == null) return null
  const raw = pro.userId
  if (raw == null || raw === '') return null
  const s = String(raw).trim()
  return s || null
}

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'GP'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('')
}

function minServicePrice(services) {
  if (!Array.isArray(services) || services.length === 0) return null
  const prices = services
    .map((s) => Number(s?.price))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (prices.length === 0) return null
  return Math.min(...prices)
}

export default function SearchPage() {
  const { user } = useContext(UserContext)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [country, setCountry] = useState(searchParams.get('country') || '')
  const [minRating, setMinRating] = useState('all')
  const [sortBy, setSortBy] = useState('rating')
  const [bookingPro, setBookingPro] = useState(null)
  const [mapCenter, setMapCenter] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [proReviewsBlock, setProReviewsBlock] = useState(null)
  const [proReviewsLoading, setProReviewsLoading] = useState(false)

  const rawType = String(searchParams.get('type') || '').toLowerCase()
  const selectedType = SERVICE_OPTIONS.some((option) => option.value === rawType)
    ? rawType
    : 'all'
  const cityFromQuery = searchParams.get('city') || ''
  const countryFromQuery = searchParams.get('country') || ''

  useEffect(() => {
    setCity(cityFromQuery)
  }, [cityFromQuery])

  useEffect(() => {
    setCountry(countryFromQuery)
  }, [countryFromQuery])

  useEffect(() => {
    let ignore = false
    async function loadProfessionals() {
      setLoading(true)
      setError('')
      try {
        const params = {}
        if (selectedType !== 'all') params.type = selectedType
        const c = (city.trim() || searchParams.get('city') || '').trim()
        const co = (country.trim() || searchParams.get('country') || '').trim()
        const merged = c && co ? `${c}, ${co}` : c || co
        if (merged) params.city = merged
        const { data } = await api.get('/api/professionals', { params })
        const list = Array.isArray(data?.professionals) ? data.professionals : []
        if (!ignore) {
          setProfessionals(list)
          if (list.length > 0) {
            setMapCenter(null)
          } else {
            const query = [c, co].filter(Boolean).join(', ')
            if (query && String(import.meta.env.VITE_MAPBOX_TOKEN || '').trim()) {
              try {
                const url =
                  `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
                  `?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}&limit=1`
                const geoRes = await fetch(url)
                const geoData = await geoRes.json()
                if (!ignore && Array.isArray(geoData?.features) && geoData.features.length > 0) {
                  const [lng, lat] = geoData.features[0].center || []
                  if (Number.isFinite(lng) && Number.isFinite(lat)) {
                    setMapCenter({ latitude: lat, longitude: lng, zoom: 11 })
                  }
                }
              } catch {
                // ignore geocode errors
              }
            }
          }
        }
      } catch (err) {
        if (!ignore) {
          setProfessionals([])
          setError(err?.response?.data?.error || 'Failed to load professionals.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    loadProfessionals()
    return () => {
      ignore = true
    }
  }, [selectedType, city, country, searchParams])

  const visibleProfessionals = useMemo(() => {
    const min = minRating === 'all' ? 0 : Number(minRating)
    const filtered = professionals.filter((pro) => Number(pro.rating || 0) >= min)
    return filtered.sort((a, b) => {
      if (sortBy === 'price') {
        const aPrice = Number.isFinite(Number(a.price)) ? Number(a.price) : Number.MAX_SAFE_INTEGER
        const bPrice = Number.isFinite(Number(b.price)) ? Number(b.price) : Number.MAX_SAFE_INTEGER
        return aPrice - bPrice
      }
      if (sortBy === 'distance') {
        return String(a.city || '').localeCompare(String(b.city || ''))
      }
      return Number(b.rating || 0) - Number(a.rating || 0)
    })
  }, [minRating, professionals, sortBy])

  useEffect(() => {
    if (!user?.id || !selectedId) {
      setProReviewsBlock(null)
      return undefined
    }
    const pro = visibleProfessionals.find((p) => String(p._id) === String(selectedId))
    const uid = professionalAccountUserId(pro)
    if (!uid) {
      setProReviewsBlock(null)
      return undefined
    }
    let ignore = false
    setProReviewsLoading(true)
    api
      .get(`/api/reviews/professional/${uid}`)
      .then(({ data }) => {
        if (!ignore) {
          setProReviewsBlock({
            userId: uid,
            summary: data?.summary || null,
            reviews: Array.isArray(data?.reviews) ? data.reviews : [],
          })
        }
      })
      .catch(() => {
        if (!ignore) setProReviewsBlock(null)
      })
      .finally(() => {
        if (!ignore) setProReviewsLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [user?.id, selectedId, visibleProfessionals])

  useEffect(() => {
    if (selectedId == null) return
    const stillVisible = visibleProfessionals.some((p) => String(p._id) === String(selectedId))
    if (!stillVisible) setSelectedId(null)
  }, [visibleProfessionals, selectedId])

  function setTypeInQuery(nextType) {
    const next = new URLSearchParams(searchParams)
    if (nextType === 'all') next.delete('type')
    else next.set('type', nextType)
    setSearchParams(next)
  }

  function handleApplyLocation() {
    const next = new URLSearchParams(searchParams)
    if (city.trim()) next.set('city', city.trim())
    else next.delete('city')
    if (country.trim()) next.set('country', country.trim())
    else next.delete('country')
    setSearchParams(next)
  }

  return (
    <section className="w-full">
      <div className="flex h-auto flex-col overflow-hidden md:h-[calc(100vh-80px)] md:flex-row">
        <div className="w-full overflow-y-auto border-r border-[#F3E8DF] bg-[#FDF6EE] p-4 md:min-h-0 md:w-[40%]">
          <div className="shrink-0">
            <h1 className="text-2xl font-semibold text-gray-900">Find professionals</h1>
            <p className="mt-1 text-sm text-gray-600">
              Browse verified vets, groomers, sitters, and trainers near you.
            </p>
          </div>

          <aside className="h-fit shrink-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Filters</h2>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Service type</p>
              {SERVICE_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="serviceType"
                    value={option.value}
                    checked={selectedType === option.value}
                    onChange={() => setTypeInQuery(option.value)}
                    className="h-4 w-4 accent-[#D85A30]"
                  />
                  {option.label}
                </label>
              ))}
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-gray-700" htmlFor="city-filter">
                City
              </label>
              <input
                id="city-filter"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={handleApplyLocation}
                placeholder="e.g. Fes"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/20"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700" htmlFor="country-filter">
                Country
              </label>
              <input
                id="country-filter"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                onBlur={handleApplyLocation}
                placeholder="e.g. Morocco"
                autoComplete="country-name"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/20"
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-gray-700" htmlFor="rating-filter">
                Min rating
              </label>
              <select
                id="rating-filter"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/20"
              >
                {MIN_RATING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-gray-700" htmlFor="sort-filter">
                Sort by
              </label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/20"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </aside>

          <div className="min-h-0 shrink-0">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="mt-3 h-4 w-2/3 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                    <div className="mt-2 h-3 w-1/3 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : visibleProfessionals.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-600 shadow-sm">
                No professionals found.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visibleProfessionals.map((pro) => {
                  const SpecialtyIcon = specialtyIcon[String(pro.specialty || '').toLowerCase()] || Stethoscope
                  const serviceMin = minServicePrice(pro.services)
                  return (
                    <article
                      key={pro._id}
                      id={`pro-${pro._id}`}
                      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-orange-100 hover:shadow-md"
                      onClick={() => navigate(`/professionals/${pro._id}`)}
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#FAECE7] text-sm font-bold text-[#D85A30]">
                          {pro.avatar ? (
                            <img src={pro.avatar} alt="" className="h-full w-full rounded-xl object-cover" />
                          ) : (
                            pro.name?.[0]?.toUpperCase() || initialsFromName(pro.name)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-gray-900">{pro.name}</p>
                            {pro.verificationStatus === 'verified' ? (
                              <span className="flex flex-shrink-0 items-center text-green-600">
                                <BadgeCheck className="h-3.5 w-3.5" />
                              </span>
                            ) : null}
                          </div>
                          <p className="flex items-center gap-1 text-xs font-medium capitalize text-[#D85A30]">
                            <SpecialtyIcon className="h-3.5 w-3.5" />
                            {pro.specialty || 'professional'}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1 font-medium text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {Number(pro.rating || 0) > 0 ? Number(pro.rating || 0).toFixed(1) : '—'}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {pro.city || 'Unknown city'}
                        </span>
                        {Number(pro.experience || 0) > 0 ? (
                          <>
                            <span>·</span>
                            <span>{Number(pro.experience)} yrs</span>
                          </>
                        ) : null}
                      </div>

                      {pro.consultationFee ? (
                        <p className="mb-3 text-xs text-gray-400">
                          From <span className="font-semibold text-gray-700">{pro.consultationFee} MAD</span>
                        </p>
                      ) : null}
                      {serviceMin ? (
                        <p className="mb-3 text-xs text-gray-400">
                          From <span className="font-semibold text-gray-700">{serviceMin} MAD</span>
                        </p>
                      ) : null}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setBookingPro(pro)
                          }}
                          className="flex-1 rounded-xl bg-[#D85A30] py-2 text-xs font-medium text-white transition-colors hover:bg-[#c44e28]"
                        >
                          Book now
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/professionals/${pro._id}`)
                          }}
                          className="flex-1 rounded-xl border border-[#D85A30] py-2 text-xs font-medium text-[#D85A30] transition-colors hover:bg-[#FAECE7]"
                        >
                          View profile
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          {user?.id && selectedId ? (
            <div id="pro-reviews-detail" className="shrink-0 rounded-2xl border border-[#EADFD6] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-900">Reviews for selected professional</h2>
                {proReviewsLoading ? <span className="text-xs text-gray-500">Loading…</span> : null}
              </div>
              {proReviewsLoading && !proReviewsBlock ? (
                <p className="mt-4 text-sm text-gray-500">Loading reviews…</p>
              ) : proReviewsBlock ? (
                <>
                  <div className="mt-3">
                    <ReviewSummary summary={proReviewsBlock.summary} />
                  </div>
                  <div className="mt-4">
                    <ReviewList reviews={proReviewsBlock.reviews} variant="ownerToPro" />
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-gray-500">Reviews could not be loaded.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="sticky top-0 hidden w-full bg-[#F3E8DF] md:block md:min-h-0 md:w-[60%]">
          <MapboxMap
            flyTo={mapCenter}
            professionals={visibleProfessionals}
            selectedId={selectedId}
            onSelectPro={(id) => {
              setSelectedId(id)
              document.getElementById(`pro-${id}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              })
            }}
            onBookNow={(pro) => setBookingPro(pro)}
            onViewProfile={(pro) => {
              if (!pro?._id) return
              navigate(`/professionals/${pro._id}`)
            }}
          />
        </div>
      </div>

      {bookingPro ? (
        <BookingModal
          preSelectedPro={bookingPro}
          onClose={() => setBookingPro(null)}
          onSuccess={() => setBookingPro(null)}
        />
      ) : null}
    </section>
  )
}
