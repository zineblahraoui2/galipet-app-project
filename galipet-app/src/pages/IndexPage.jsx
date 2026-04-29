import { createElement, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GiPawPrint } from 'react-icons/gi'
import { BookOpen, Heart, Home, PawPrint, Scissors, Sparkles, Stethoscope } from 'lucide-react'
import pawBackground from '../assets/paw-background.png'
import HeroSection from '../components/HeroSection.jsx'
import LandingFooter from '../components/LandingFooter.jsx'

const LANG_STORAGE_KEY = 'galipet:landing-lang'

function readStoredLang() {
  try {
    const saved = String(localStorage.getItem(LANG_STORAGE_KEY) || '').toLowerCase()
    if (saved === 'en' || saved === 'fr') return saved
  } catch {
    // ignore storage read failures
  }
  return 'en'
}

function ServiceCard({ className, title, subtitle, icon, background, onClick, bookNowLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-5 text-left shadow-sm transition hover:shadow-md ${className}`}
      style={{
        backgroundImage: background,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex h-full flex-col justify-between">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#1a1a1a] shadow">
          {createElement(icon, { className: 'h-4 w-4' })}
        </span>
        <div>
          <p className="text-4xl font-black text-white">{title}</p>
          <p className="text-sm text-white/90">{subtitle}</p>
          <span className="mt-3 inline-flex rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white">
            {bookNowLabel}
          </span>
        </div>
      </div>
    </button>
  )
}

export default function IndexPage() {
  const navigate = useNavigate()
  const [lang] = useState(readStoredLang)

  const copy = {
    en: {
      discover: 'Discover →',
      bookNow: 'Book now',
      stats: [
        ['500+', 'pet services'],
        ['4', 'service categories'],
        ['24/7', 'access to pet care'],
        ['100%', 'designed for pet pals & their people'],
      ],
      servicesLabel: 'DISCOVER',
      servicesTitle: 'Explore top-rated pet care services',
      servicesSubtitle: 'From grooming to training, find trusted professionals near you.',
      health: 'Health',
      healthSub: 'Expert care, happy pets',
      sitting: 'Pet-sitting',
      sittingSub: 'Care & safety while you relax',
      grooming: 'Grooming',
      groomingSub: 'Shiny fur, happy tails',
      education: 'Education',
      educationSub: 'Training & behavior that lasts',
      marketplace: 'Nutrition & accessories',
      soon: 'Coming soon',
      accessories: 'Accessories',
      nutrition: 'Nutrition',
      exploreMore: 'Explore more →',
      joinLabel: 'JOIN US',
      joinTitle: 'Be part of a loving pet community',
      joinBullets: ['Share moments', 'Get expert tips', 'Join local events', 'Make new furry friends'],
      joinBtn: 'Join the community →',
      petsPaw: "Pets' Paw",
      petsPawSubtitle: 'Every paw leaves a mark on our hearts',
      counters: [
        ['12K+', 'Happy Pets'],
        ['8K+', 'Pet Parents'],
        ['25K+', 'Paws of Love'],
      ],
      proTitle: 'Are you an animal care professional?',
      proSub: 'Join our network and grow your business while helping pets in need.',
      start: 'Get started →',
      login: 'Log in',
    },
    fr: {
      discover: 'Decouvrir →',
      bookNow: 'Reserver',
      stats: [
        ['500+', 'services animaux'],
        ['4', 'categories de services'],
        ['24/7', 'acces aux soins'],
        ['100%', 'pense pour vous & vos compagnons'],
      ],
      servicesLabel: 'DECOUVRIR',
      servicesTitle: 'Explorez les meilleurs services pour animaux',
      servicesSubtitle: 'Du toilettage au dressage, trouvez des professionnels de confiance pres de chez vous.',
      health: 'Sante',
      healthSub: 'Des soins experts pour des animaux heureux',
      sitting: 'Pet-sitting',
      sittingSub: 'Garde & promenades',
      grooming: 'Toilettage',
      groomingSub: 'Un pelage sain et brillant',
      education: 'Education',
      educationSub: 'Dressage & comportement durable',
      marketplace: 'Nutrition & accessoires',
      soon: 'Bientot disponible',
      accessories: 'Accessoires',
      nutrition: 'Nutrition',
      exploreMore: 'Voir plus →',
      joinLabel: 'REJOIGNEZ-NOUS',
      joinTitle: "Faites partie d'une communaute pet-friendly",
      joinBullets: ['Partagez vos moments', 'Recevez des conseils experts', 'Participez a des evenements locaux', 'Rencontrez de nouveaux amis'],
      joinBtn: 'Rejoindre la communaute →',
      petsPaw: 'Pattes & amour',
      petsPawSubtitle: 'Chaque patte laisse une trace dans nos coeurs',
      counters: [
        ['12K+', 'Animaux heureux'],
        ['8K+', 'Pet parents'],
        ['25K+', "Pattes d'amour"],
      ],
      proTitle: 'Vous etes un professionnel animalier ?',
      proSub: 'Rejoignez notre reseau et developpez votre activite en aidant les animaux.',
      start: 'Commencer →',
      login: 'Se connecter',
    },
  }
  const t = copy[lang]

  const serviceBg = {
    vet: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 60%), url('https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=1200')",
    sitting:
      "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 60%), url('https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900')",
    grooming:
      "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 60%), url('https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=900')",
    training:
      "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 60%), url('https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=900')",
    why:
      "linear-gradient(140deg, rgba(224,92,42,0.35), rgba(26,26,26,0.45)), url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1300')",
  }

  return (
    <div className="relative left-1/2 isolate flex min-h-0 w-screen max-w-[100vw] flex-1 -translate-x-1/2 flex-col overflow-x-clip bg-[#FDF6EE] text-[#1a1a1a] min-h-[calc(100svh-4rem)]">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[#FDF6EE]"
        style={{
          backgroundImage: `url('${pawBackground}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.92,
        }}
        aria-hidden
      />
      <div className="relative z-10 flex flex-1 flex-col space-y-10 pb-6">
      <HeroSection />

      <div className="mx-auto flex w-full max-w-6xl justify-center px-4 py-2 md:px-8 md:py-3 lg:px-12" aria-hidden>
        <GiPawPrint className="text-[#E05C2A]" size={36} style={{ opacity: 0.55 }} />
      </div>

      <section className="relative left-1/2 w-screen -translate-x-1/2 bg-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 px-4 py-5 md:flex md:items-center md:justify-between md:px-8 lg:px-12">
          {t.stats.map(([value, label], idx) => (
            <div key={value} className="flex items-center justify-center gap-2 text-center lg:justify-start">
              <span className="text-3xl font-black">{value}</span>
              <span className="text-sm text-gray-500">{label}</span>
              {idx < 3 ? <span className="ml-2 hidden text-gray-300 lg:inline">|</span> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-[#EADFD6] bg-white p-5 shadow-sm px-4 md:px-8 lg:px-12">
        <p className="text-xs font-bold uppercase tracking-[2px] text-[#E05C2A]">{t.servicesLabel}</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight">{t.servicesTitle}</h2>
        <p className="mt-2 text-gray-600">{t.servicesSubtitle}</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ServiceCard
            className="min-h-[280px] sm:col-span-2 lg:col-span-3 lg:min-h-[330px]"
            title={t.health}
            subtitle={t.healthSub}
            icon={Stethoscope}
            bookNowLabel={t.bookNow}
            background={serviceBg.vet}
            onClick={() => navigate('/search?type=vet')}
          />

          <div className="grid gap-4 sm:col-span-2 lg:col-span-2">
            <ServiceCard
              className="min-h-[157px]"
              title={t.sitting}
              subtitle={t.sittingSub}
              icon={Home}
              bookNowLabel={t.bookNow}
              background={serviceBg.sitting}
              onClick={() => navigate('/search?type=sitting')}
            />
            <ServiceCard
              className="min-h-[157px]"
              title={t.grooming}
              subtitle={t.groomingSub}
              icon={Scissors}
              bookNowLabel={t.bookNow}
              background={serviceBg.grooming}
              onClick={() => navigate('/search?type=grooming')}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ServiceCard
            className="min-h-[190px]"
            title={t.education}
            subtitle={t.educationSub}
            icon={BookOpen}
            bookNowLabel={t.bookNow}
            background={serviceBg.training}
            onClick={() => navigate('/search?type=training')}
          />
          <div className="rounded-2xl border border-[#EADFD6] bg-[#FBF7F0] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black">{t.marketplace}</p>
              <span className="rounded-full bg-[#FEF3EE] px-3 py-1 text-xs font-semibold text-[#E05C2A]">{t.soon}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700">{t.accessories}</span>
              <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700">{t.nutrition}</span>
            </div>
            <p className="mt-6 text-sm font-semibold text-[#1a1a1a]">{t.exploreMore}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 md:grid-cols-2 md:px-8 lg:px-12">
        <div className="rounded-2xl border border-[#EADFD6] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[2px] text-[#E05C2A]">{t.joinLabel}</p>
          <h2 className="mt-2 text-3xl font-black leading-tight">{t.joinTitle}</h2>
          <ul className="mt-5 space-y-2">
            {t.joinBullets.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <Sparkles className="h-4 w-4 text-[#E05C2A]" />
                {item}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-6 rounded-full bg-[#1a1a1a] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {t.joinBtn}
          </button>
        </div>

        <div
          className="min-h-[260px] rounded-2xl border border-[#EADFD6] bg-cover bg-center shadow-sm"
          style={{ backgroundImage: serviceBg.why }}
        />
      </section>

      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-[#EADFD6] bg-white p-5 shadow-sm px-4 md:px-8 lg:px-12">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[2px] text-[#E05C2A]">{t.petsPaw}</p>
            <h3 className="mt-1 text-xl font-black">{t.petsPawSubtitle}</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {t.counters.map(([count, label], idx) => (
              <div key={count} className="rounded-xl bg-[#FEF8F3] p-3 text-center">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#E05C2A]">
                  {idx === 1 ? <Heart className="h-4 w-4" /> : <PawPrint className="h-4 w-4" />}
                </div>
                <p className="text-xl font-black">{count}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-4 md:mx-10 lg:mx-auto w-auto max-w-6xl px-0 pb-16 md:pb-20">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <h3 className="text-2xl font-black">{t.proTitle}</h3>
          <p className="mt-2 text-sm text-gray-600">
            {t.proSub}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="inline-flex min-h-11 items-center rounded-full bg-[#1a1a1a] px-8 py-3 text-sm font-semibold text-white">{t.start}</Link>
            <Link to="/login" className="inline-flex min-h-11 items-center rounded-full border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-[#1a1a1a]">{t.login}</Link>
          </div>
        </div>
      </section>

      <LandingFooter lang={lang} />
      </div>
    </div>
  )
}
