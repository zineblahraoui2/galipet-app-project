import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Cat,
  Dog,
  GraduationCap,
  Home,
  Lightbulb,
  MapPin,
  Moon,
  Scissors,
  Search,
  Star,
  Stethoscope,
  Sun,
  Sunset,
} from 'lucide-react'
import { UserContext } from '../UserContext.jsx'
import { api } from '../api/client.js'
import { enrichOwnerBookingForDisplay } from '../utils/ownerBooking.js'
import ReviewPromptBanner from '../components/reviews/ReviewPromptBanner.jsx'
import ownerHomeBackground from '../assets/owner-home-background.png'
/** One tip per weekday (getDay); icons are Lucide components — dogs & cats only */
const TIPS = [
  {
    Icon: Dog,
    text: 'Most dogs need at least 1–2 hours of daily activity—split walks, sniff time, and play to match their age and breed.',
  },
  {
    Icon: Cat,
    text: 'Offer fresh water every day; many cats drink more from a wide, shallow bowl or a quiet water fountain.',
  },
  {
    Icon: Dog,
    text: "Brush your dog's teeth 2–3 times a week (vet-approved toothpaste) to reduce plaque and painful dental disease.",
  },
  {
    Icon: Cat,
    text: 'Scoop the litter tray daily—cats are clean animals and a fresh tray lowers stress and litter-box avoidance.',
  },
  {
    Icon: Dog,
    text: 'Never give dogs chocolate, grapes, raisins, onions, garlic, or xylitol—they are toxic even in small amounts.',
  },
  {
    Icon: Cat,
    text: 'Indoor cats stay safer from traffic and fights; add scratching posts, perches, and window views for mental stimulation.',
  },
  {
    Icon: Dog,
    text: 'Puppies need short, frequent outings; senior dogs prefer gentle, steady walks—adjust length and pace to their joints.',
  },
]

const SERVICE_LABELS = {
  vet: 'Vets',
  grooming: 'Groomers',
  sitting: 'Sitters',
  training: 'Trainers',
}

const SERVICE_ICONS = {
  vet: Stethoscope,
  grooming: Scissors,
  sitting: Home,
  training: GraduationCap,
}

function greetingByHour() {
  const hour = new Date().getHours()
  if (hour < 12) {
    return { label: 'Good morning', Icon: Sun, iconClass: 'text-[#E05C2A]' }
  }
  if (hour < 18) {
    return { label: 'Good afternoon', Icon: Sunset, iconClass: 'text-[#E05C2A]' }
  }
  return { label: 'Good evening', Icon: Moon, iconClass: 'text-[#c94e22]' }
}

function daysAgoLabel(dateLike) {
  if (!dateLike) return 'today'
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return 'today'
  const diffMs = Date.now() - date.getTime()
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function iconContainerClass(extra = '') {
  return `inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#E05C2A] shadow-sm ${extra}`.trim()
}

export default function OwnerHome() {
  const { user, ready } = useContext(UserContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [topRated, setTopRated] = useState([])
  const [loadingTopRated, setLoadingTopRated] = useState(true)
  const [recentBooking, setRecentBooking] = useState(null)
  const [loadingBooking, setLoadingBooking] = useState(true)
  const [toastMsg, setToastMsg] = useState('')
  const todaysTip = useMemo(() => TIPS[new Date().getDay()], [])
  const greeting = useMemo(() => greetingByHour(), [])
  const assetBase = import.meta.env.BASE_URL || '/'
  const pawPetImage = `${assetBase}assets/paw-pet.png`
  const circleImage = (name) => `${assetBase}images/${name}`

  useEffect(() => {
    if (user?.city) setCity(String(user.city))
  }, [user?.city])

  useEffect(() => {
    let cancelled = false
    async function loadTopRated() {
      setLoadingTopRated(true)
      try {
        // Backend currently sorts by rating desc by default; limit/sort params are ignored there.
        const { data } = await api.get('/api/professionals', {
          params: { limit: 3, sort: 'rating' },
        })
        const list = Array.isArray(data?.professionals) ? data.professionals : []
        if (!cancelled) setTopRated(list.slice(0, 3))
      } catch {
        if (!cancelled) setTopRated([])
      } finally {
        if (!cancelled) setLoadingTopRated(false)
      }
    }
    loadTopRated()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadRecentBooking() {
      setLoadingBooking(true)
      try {
        // API returns owner bookings already sorted by date desc.
        const { data } = await api.get('/api/bookings', {
          params: { userId: 'me', limit: 1, sort: 'recent' },
        })
        const list = Array.isArray(data?.bookings) ? data.bookings : []
        if (!cancelled) setRecentBooking(list[0] ? enrichOwnerBookingForDisplay(list[0]) : null)
      } catch {
        if (!cancelled) setRecentBooking(null)
      } finally {
        if (!cancelled) setLoadingBooking(false)
      }
    }
    loadRecentBooking()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const t = location.state?.toast
    if (typeof t === 'string' && t.trim()) {
      setToastMsg(t.trim())
      navigate('.', { replace: true, state: {} })
    }
  }, [location.state, navigate])

  useEffect(() => {
    if (!toastMsg) return undefined
    const id = window.setTimeout(() => setToastMsg(''), 6000)
    return () => window.clearTimeout(id)
  }, [toastMsg])

  if (!ready) {
    return <p className="mt-10 text-center text-sm text-gray-500">Loading…</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const role = String(user.role || 'owner').toLowerCase()
  if (role !== 'owner') {
    return <Navigate to="/" replace />
  }

  function buildSearchLocationParams() {
    const params = new URLSearchParams()
    if (city.trim()) params.set('city', city.trim())
    if (country.trim()) params.set('country', country.trim())
    return params
  }

  function handleSearch(ev) {
    ev.preventDefault()
    navigate(`/search?${buildSearchLocationParams().toString()}`)
  }

  function handleBookFromTopRated(type) {
    const params = buildSearchLocationParams()
    if (type) params.set('type', type)
    navigate(`/search?${params.toString()}`)
  }

  function handleBookAgain() {
    const type = recentBooking?.serviceType || recentBooking?.professional?.specialty
    const params = buildSearchLocationParams()
    if (type) params.set('type', String(type))
    navigate(`/search?${params.toString()}`)
  }

  return (
    <section className="relative left-1/2 min-h-[60vh] w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip overflow-y-visible bg-[#F6EFE9] pt-3 pb-5 text-left md:pt-5 md:pb-8">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${ownerHomeBackground}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.35,
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#F6EFE9]/72" aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
        <img
          src={pawPetImage}
          alt=""
          className="absolute left-[1%] top-[4%] h-14 w-14 rotate-[18deg] object-contain opacity-[0.32] drop-shadow-[0_5px_16px_rgba(224,92,42,0.22)] sm:h-16 sm:w-16"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute right-[3%] top-[8%] h-11 w-11 -rotate-[12deg] object-contain opacity-[0.3] drop-shadow-[0_4px_14px_rgba(224,92,42,0.2)]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute left-[18%] top-[28%] h-9 w-9 rotate-[25deg] object-contain opacity-[0.28]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute right-[12%] top-[32%] h-12 w-12 rotate-[-20deg] object-contain opacity-[0.34] drop-shadow-[0_6px_18px_rgba(224,92,42,0.22)]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute left-[8%] top-[48%] h-10 w-10 -rotate-[8deg] object-contain opacity-[0.26]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute right-[6%] top-[52%] h-[2.75rem] w-[2.75rem] rotate-[33deg] object-contain opacity-[0.31]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute left-[42%] top-[18%] h-8 w-8 rotate-[-28deg] object-contain opacity-[0.24] md:left-[38%]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute right-[28%] top-[58%] h-10 w-10 rotate-[7deg] object-contain opacity-[0.29]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute bottom-[38%] left-[4%] h-12 w-12 rotate-[22deg] object-contain opacity-[0.32]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute bottom-[32%] right-[8%] h-9 w-9 -rotate-[15deg] object-contain opacity-[0.27]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute bottom-[12%] left-[22%] h-11 w-11 rotate-[-6deg] object-contain opacity-[0.3] drop-shadow-[0_5px_16px_rgba(224,92,42,0.2)]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute bottom-[8%] right-[20%] h-10 w-10 rotate-[40deg] object-contain opacity-[0.26]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute bottom-[22%] right-[2%] h-[2.6rem] w-[2.6rem] -rotate-[22deg] object-contain opacity-[0.32] sm:right-[4%]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute left-[52%] top-[42%] h-7 w-7 -rotate-[18deg] object-contain opacity-[0.25]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute left-[30%] top-[62%] h-8 w-8 rotate-[16deg] object-contain opacity-[0.28]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute right-[40%] top-[8%] h-6 w-6 rotate-[36deg] object-contain opacity-[0.22]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute right-[1%] top-[40%] h-10 w-10 -rotate-[9deg] object-contain opacity-[0.27]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute left-[6%] bottom-[48%] h-8 w-8 rotate-[-24deg] object-contain opacity-[0.24]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute left-[65%] bottom-[18%] h-9 w-9 rotate-[11deg] object-contain opacity-[0.26]"
        />
        <img
          src={pawPetImage}
          alt=""
          className="absolute right-[35%] bottom-[6%] h-7 w-7 -rotate-[31deg] object-contain opacity-[0.23]"
        />
        <div className="absolute left-[20%] top-[38%] h-44 w-44 rounded-full bg-[#E05C2A]/[0.06] blur-3xl" />
        <div className="absolute right-[15%] top-[22%] h-36 w-36 rounded-full bg-[#E05C2A]/[0.05] blur-3xl" />
        <div className="absolute bottom-[20%] left-[40%] h-52 w-52 rounded-full bg-[#F4A574]/[0.08] blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-none">
        {toastMsg ? (
          <div
            className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-800 shadow-sm"
            role="status"
          >
            {toastMsg}
          </div>
        ) : null}
        <ReviewPromptBanner />
        <section className="mb-6 grid grid-cols-1 items-center gap-5 md:mb-8 md:grid-cols-[minmax(0,50%)_minmax(0,1fr)] md:gap-x-10 md:gap-y-7 md:items-center">
          <div className="relative min-w-0">
            <img
              src={pawPetImage}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -right-1 top-4 z-0 h-[92px] w-[92px] object-contain opacity-[0.8] drop-shadow-[0_12px_32px_rgba(224,92,42,0.28)] sm:right-0 sm:top-6 md:h-[104px] md:w-[104px] md:opacity-[0.84]"
            />
            <img
              src={pawPetImage}
              alt=""
              aria-hidden
              className="pointer-events-none absolute bottom-0 right-6 z-0 h-12 w-12 rotate-[11deg] object-contain opacity-[0.45] drop-shadow-[0_5px_18px_rgba(224,92,42,0.24)] md:right-10 md:h-14 md:w-14"
            />
            <div className="relative z-10 pl-8 md:pl-12 lg:pl-16">
            <header>
              <p className="inline-flex items-center gap-2 text-sm text-gray-500">
                <greeting.Icon className={`h-4 w-4 ${greeting.iconClass}`} />
                {greeting.label}
              </p>
              <h1 className="mt-1 flex items-center gap-2 text-4xl font-bold leading-tight tracking-tight text-[#1A1A1A] md:text-5xl">
                <span className="leading-[1.05]">
                  <span className="block">Welcome back,</span>
                  <span className="block text-[#E05C2A]">{user.name}</span>
                </span>
                <Dog
                  className="ml-1 h-11 w-11 shrink-0 self-center text-[#E05C2A] md:ml-2 md:h-14 md:w-14"
                  strokeWidth={1.85}
                  aria-hidden
                />
              </h1>
              <p className="mt-1 text-sm text-gray-400">What does your dog or cat need today?</p>
            </header>

            <section className="mt-6 max-w-lg rounded-3xl bg-white p-8 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-12px_rgba(0,0,0,0.1)]">
              <h2 className="mb-5 flex items-center gap-2.5 text-xs font-bold uppercase leading-none tracking-[0.14em] text-gray-800">
                <MapPin className="h-5 w-5 shrink-0 text-[#E05C2A]" strokeWidth={2.25} aria-hidden />
                <span className="inline-flex items-center leading-none">Quick search</span>
              </h2>
              <form onSubmit={handleSearch} className="w-full">
                <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City — e.g. Fes"
                      autoComplete="address-level2"
                      className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-gray-400 focus:border-[#E05C2A] focus:bg-white"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country — e.g. Morocco"
                      autoComplete="country-name"
                      className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-gray-400 focus:border-[#E05C2A] focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex min-h-[2.75rem] min-w-[100px] shrink-0 items-center justify-center gap-2 rounded-full bg-[#E05C2A] px-7 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#c94e22] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E05C2A]"
                  >
                    <Search className="size-4 text-white" strokeWidth={2.5} aria-hidden />
                    Search
                  </button>
                </div>
              </form>
              <p className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-left text-[13px] leading-relaxed text-gray-500">
                <span>Use</span>
                <span className="inline-flex items-center gap-1 font-medium text-gray-600">
                  <Stethoscope className="h-3.5 w-3.5 text-[#E05C2A]" aria-hidden strokeWidth={2.25} />
                  Vets
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-gray-600">
                  <Scissors className="h-3.5 w-3.5 text-[#E05C2A]" aria-hidden strokeWidth={2.25} />
                  Groomers
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-gray-600">
                  <Home className="h-3.5 w-3.5 text-[#E05C2A]" aria-hidden strokeWidth={2.25} />
                  Sitters
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-gray-600">
                  <GraduationCap className="h-3.5 w-3.5 text-[#E05C2A]" aria-hidden strokeWidth={2.25} />
                  Trainers
                </span>
                <span className="text-gray-500">in the menu above to filter by service.</span>
              </p>
            </section>
            </div>
          </div>

          <div className="relative hidden min-h-0 min-w-0 translate-y-0 overflow-visible pr-4 md:flex md:h-[276px] md:translate-y-1 md:items-center md:justify-center md:pr-10">
            <img
              src={pawPetImage}
              alt=""
              aria-hidden
              className="pointer-events-none absolute left-[-6px] top-[-14px] z-0 h-[82px] w-[82px] object-contain opacity-[0.88] drop-shadow-[0_10px_22px_rgba(224,92,42,0.3)]"
            />
            <img
              src={pawPetImage}
              alt=""
              aria-hidden
              className="pointer-events-none absolute left-[58px] top-[84px] z-0 h-[64px] w-[64px] rotate-[6deg] object-contain opacity-[0.68] drop-shadow-[0_8px_18px_rgba(224,92,42,0.26)]"
            />
            <Link
              to="/search?type=grooming"
              aria-label="Search groomers"
              className="absolute left-[8.5rem] top-[-4px] z-10 flex h-[160px] w-[160px] cursor-pointer items-center justify-center rounded-full border-4 border-white bg-white shadow-lg ring-1 ring-[#E05C2A]/20 transition duration-200 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05C2A]/45 focus-visible:ring-offset-2"
            >
              <span className="flex h-[126px] w-[126px] overflow-hidden rounded-full border-2 border-dashed border-[#E05C2A]/35 bg-[#F6EFE9]">
                <img src={circleImage('groomer.png')} alt="" className="h-full w-full object-cover" />
              </span>
            </Link>
            <Link
              to="/search?type=sitting"
              aria-label="Search sitters"
              className="absolute right-[14rem] top-[-4px] z-10 flex h-[160px] w-[160px] cursor-pointer items-center justify-center rounded-full border-4 border-white bg-white shadow-lg ring-1 ring-[#E05C2A]/20 transition duration-200 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05C2A]/45 focus-visible:ring-offset-2"
            >
              <span className="flex h-[126px] w-[126px] overflow-hidden rounded-full border-2 border-dashed border-[#E05C2A]/35 bg-[#F6EFE9]">
                <img src={circleImage('sitter.png')} alt="" className="h-full w-full object-cover" />
              </span>
            </Link>
            <Link
              to="/search?type=vet"
              aria-label="Search vets"
              className="absolute bottom-[-22px] left-[8.5rem] z-10 flex h-[160px] w-[160px] cursor-pointer items-center justify-center rounded-full border-4 border-white bg-white shadow-lg ring-1 ring-[#E05C2A]/20 transition duration-200 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05C2A]/45 focus-visible:ring-offset-2"
            >
              <span className="flex h-[126px] w-[126px] overflow-hidden rounded-full border-2 border-dashed border-[#E05C2A]/35 bg-[#F6EFE9]">
                <img src={circleImage('vet.png')} alt="" className="h-full w-full object-cover" />
              </span>
            </Link>
            <Link
              to="/search?type=training"
              aria-label="Search trainers"
              className="absolute bottom-[-24px] right-[14.5rem] z-10 flex h-[166px] w-[166px] cursor-pointer items-center justify-center rounded-full border-4 border-white bg-white shadow-lg ring-1 ring-[#E05C2A]/20 transition duration-200 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05C2A]/45 focus-visible:ring-offset-2"
            >
              <span className="flex h-[130px] w-[130px] overflow-hidden rounded-full border-2 border-dashed border-[#E05C2A]/35 bg-[#F6EFE9]">
                <img src={circleImage('trainer.png')} alt="" className="h-full w-full object-cover" />
              </span>
            </Link>
          </div>
        </section>

        <section className="relative mb-8 overflow-hidden rounded-[28px] px-1 sm:px-2">
          <img
            src={pawPetImage}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -right-1 top-0 z-0 h-16 w-16 rotate-[16deg] object-contain opacity-[0.2] drop-shadow-[0_4px_14px_rgba(224,92,42,0.18)] sm:right-2 sm:h-[4.5rem] sm:w-[4.5rem]"
          />
          <img
            src={pawPetImage}
            alt=""
            aria-hidden
            className="pointer-events-none absolute bottom-2 left-2 z-0 h-11 w-11 -rotate-[12deg] object-contain opacity-[0.18] drop-shadow-[0_3px_12px_rgba(224,92,42,0.15)]"
          />
          <div className="pointer-events-none absolute right-[8%] top-[40%] z-0 h-24 w-24 rounded-full bg-[#E05C2A]/[0.04] blur-2xl sm:right-[12%]" aria-hidden />
          <div className="relative z-10">
          <h2 className="mb-3 flex items-center gap-2.5 text-xs font-bold uppercase leading-none tracking-[0.14em] text-[#1A1A1A]">
            <Star
              className="h-5 w-5 shrink-0 fill-[#E05C2A] stroke-[#E05C2A]"
              strokeWidth={1.25}
              aria-hidden
            />
            <span className="inline-flex items-center leading-none">Top rated near you</span>
          </h2>

          {loadingTopRated ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-[22px] bg-white shadow-sm">
                  <div className="p-5">
                    <div className="animate-pulse">
                      <div className="h-9 w-9 rounded-full bg-gray-200" />
                      <div className="mt-3 h-4 w-2/3 rounded bg-gray-200" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                      <div className="mt-3 h-3 w-1/3 rounded bg-gray-100" />
                      <div className="mt-3 h-8 w-full rounded bg-gray-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : topRated.length === 0 ? (
            <div className="rounded-[22px] bg-white p-5 text-sm text-gray-500 shadow-sm">
              No professionals found near you yet
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {topRated.map((pro) => {
                const specialty = String(pro.specialty || '')
                const label = SERVICE_LABELS[specialty] || 'Service'
                const rating = Number(pro.rating || 0)
                const reviews = Number(pro.reviewsCount || 0)
                return (
                  <article
                    key={pro._id}
                    className="rounded-[22px] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#E05C2A] shadow-sm ring-1 ring-[#E05C2A]/15">
                        {String(pro.name || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/professionals/${pro._id}`)}
                          className="truncate text-left text-sm font-semibold text-gray-900 transition-colors hover:text-[#D85A30]"
                        >
                          {pro.name}
                        </button>
                        <p className="text-xs font-medium text-[#E05C2A]">{label}</p>
                      </div>
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
                      <Star
                        className="h-3.5 w-3.5 shrink-0 fill-[#E05C2A] stroke-[#E05C2A]"
                        strokeWidth={1.25}
                        aria-hidden
                      />
                      {rating.toFixed(1)} · {reviews} reviews
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#E05C2A]" strokeWidth={2.25} aria-hidden />
                      {pro.city || 'Unknown city'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleBookFromTopRated(specialty)}
                      className="primary mt-3 flex w-full items-center justify-center"
                    >
                      Book now
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/professionals/${pro._id}`)}
                      className="w-full py-1 text-center text-xs text-[#D85A30] transition-colors hover:underline"
                    >
                      View full profile →
                    </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
          </div>
        </section>

        <section className="relative mb-8 overflow-hidden rounded-[22px] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="relative z-10">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#1A1A1A]">
            <Lightbulb className="h-4 w-4 shrink-0 text-[#E05C2A]" strokeWidth={2.25} aria-hidden />
            Pet tip of the day
          </h2>
          <article className="flex items-center gap-3 rounded-xl border-l-4 border-[#E05C2A] bg-white p-3">
            <span className={iconContainerClass('h-9 w-9 shrink-0')} aria-hidden>
              {(() => {
                const TipIcon = todaysTip.Icon
                return <TipIcon className="h-5 w-5 shrink-0 text-[#E05C2A]" strokeWidth={2.25} />
              })()}
            </span>
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-gray-700 text-pretty">{todaysTip.text}</p>
          </article>
          </div>
          <img
            src={pawPetImage}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-3 top-10 z-0 h-12 w-12 rotate-[10deg] object-contain opacity-[0.28] drop-shadow-[0_4px_14px_rgba(224,92,42,0.2)]"
          />
          <img
            src={pawPetImage}
            alt=""
            aria-hidden
            className="pointer-events-none absolute bottom-6 right-[4.5rem] z-0 h-[58px] w-[58px] object-contain opacity-[0.62] drop-shadow-[0_10px_24px_rgba(224,92,42,0.28)]"
          />
          <img
            src={pawPetImage}
            alt=""
            aria-hidden
            className="pointer-events-none absolute bottom-4 right-4 z-0 h-[50px] w-[50px] rotate-[-12deg] object-contain opacity-[0.52] drop-shadow-[0_6px_20px_rgba(224,92,42,0.24)]"
          />
        </section>

        {!loadingBooking && recentBooking ? (
          <section className="relative mb-8 overflow-hidden rounded-[22px] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <img
              src={pawPetImage}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -bottom-1 right-6 z-0 h-14 w-14 rotate-[-14deg] object-contain opacity-[0.22] drop-shadow-[0_4px_14px_rgba(224,92,42,0.18)]"
            />
            <div className="pointer-events-none absolute right-0 top-0 z-0 h-20 w-20 rounded-full bg-[#E05C2A]/[0.05] blur-2xl" aria-hidden />
            <div className="relative z-10">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#1A1A1A]">
              Book again
            </h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className={iconContainerClass('h-10 w-10 text-base')}>
                  {(() => {
                    const ServiceIcon = SERVICE_ICONS[recentBooking.serviceType] || Stethoscope
                    return <ServiceIcon className="h-4 w-4" aria-hidden strokeWidth={2.25} />
                  })()}
                </div>
                <p className="truncate text-sm font-semibold text-gray-900">
                  {recentBooking?.professional?.name || 'Professional'}
                </p>
                <p className="text-xs font-medium text-[#E05C2A]">
                  {SERVICE_LABELS[recentBooking.serviceType] || recentBooking.serviceType || 'Service'}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <Star
                    className="h-3.5 w-3.5 shrink-0 fill-[#E05C2A] stroke-[#E05C2A]"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                  {Number(recentBooking?.professional?.rating || 0).toFixed(1)} · Last visit:{' '}
                  {daysAgoLabel(recentBooking.date)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleBookAgain}
                className="primary flex items-center justify-center"
              >
                Book again →
              </button>
            </div>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  )
}
