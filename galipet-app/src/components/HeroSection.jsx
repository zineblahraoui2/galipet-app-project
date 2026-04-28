import { Link } from 'react-router-dom'
import { GiPawPrint } from 'react-icons/gi'

/** Files in `public/images/` — use `.jpg` here once you add real JPEG exports. */
const HERO_CIRCLE_IMAGES = {
  vet: 'vet.png',
  groomer: 'groomer.png',
  trainer: 'trainer.png',
  sitter: 'sitter.png',
}

/** Public folder URLs — respects Vite `base` when the app is not served at the domain root. */
function publicImage(filename) {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  return `${normalized}images/${filename}`
}

export default function HeroSection() {
  return (
    <section className="relative z-10 flex min-h-[400px] w-full items-center justify-center overflow-hidden bg-transparent">
      <svg
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[min(55vw,280px)] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]"
        viewBox="0 0 520 280"
        fill="none"
        aria-hidden
      >
        <ellipse
          cx="260"
          cy="140"
          rx="240"
          ry="120"
          stroke="#E05C2A"
          strokeWidth="2"
          strokeDasharray="10 14"
        />
      </svg>

      {/* Petites pattes décoratives (×6) — positions irrégulières, zones vides du fond (sous le texte z-[3]) */}
      <GiPawPrint
        size={19}
        className="paw-spin-float pointer-events-none absolute z-[1] text-[#D85A30]"
        style={{
          top: '27%',
          left: '11%',
          ['--r']: '22deg',
          opacity: 0.36,
          animationDelay: '0.35s',
        }}
        aria-hidden
      />
      <GiPawPrint
        size={22}
        className="paw-spin-float pointer-events-none absolute z-[1] text-[#D85A30]"
        style={{
          top: '61%',
          right: '9%',
          ['--r']: '-18deg',
          opacity: 0.32,
          animationDelay: '2.2s',
        }}
        aria-hidden
      />
      <GiPawPrint
        size={17}
        className="paw-spin-float pointer-events-none absolute z-[1] text-[#D85A30]"
        style={{
          bottom: '26%',
          left: '19%',
          ['--r']: '-42deg',
          opacity: 0.38,
          animationDelay: '1.05s',
        }}
        aria-hidden
      />
      <GiPawPrint
        size={16}
        className="paw-spin-float pointer-events-none absolute z-[1] text-[#D85A30]"
        style={{
          top: '19%',
          right: '24%',
          ['--r']: '31deg',
          opacity: 0.3,
          animationDelay: '1.55s',
        }}
        aria-hidden
      />
      <GiPawPrint
        size={21}
        className="paw-spin-float pointer-events-none absolute z-[1] text-[#D85A30]"
        style={{
          top: '43%',
          left: '7%',
          ['--r']: '-11deg',
          opacity: 0.34,
          animationDelay: '0.8s',
        }}
        aria-hidden
      />
      <GiPawPrint
        size={18}
        className="paw-spin-float pointer-events-none absolute z-[1] text-[#D85A30]"
        style={{
          bottom: '17%',
          right: '17%',
          ['--r']: '48deg',
          opacity: 0.33,
          animationDelay: '2.65s',
        }}
        aria-hidden
      />

      <span
        className="pointer-events-none absolute left-[18%] top-[28%] z-[2] h-1.5 w-1.5 rounded-full bg-[#E05C2A] opacity-[0.15]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute right-[22%] top-[32%] z-[2] h-1.5 w-1.5 rounded-full bg-[#F5C842] opacity-[0.15]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-[26%] left-[30%] z-[2] h-1.5 w-1.5 rounded-full bg-[#5CB85C] opacity-[0.15]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-[22%] right-[28%] z-[2] h-1.5 w-1.5 rounded-full bg-[#4AABDB] opacity-[0.15]"
        aria-hidden
      />

      <GiPawPrint
        size={44}
        className="paw-spin-float pointer-events-none absolute z-[2] text-[#D85A30]"
        style={{
          top: '12%',
          left: '5%',
          ['--r']: '-25deg',
          opacity: 0.22,
          animationDelay: '0s',
        }}
        aria-hidden
      />
      <GiPawPrint
        size={38}
        className="paw-spin-float pointer-events-none absolute z-[2] text-[#D85A30]"
        style={{
          top: '10%',
          right: '5%',
          ['--r']: '20deg',
          opacity: 0.2,
          animationDelay: '1.5s',
        }}
        aria-hidden
      />
      <GiPawPrint
        size={40}
        className="paw-spin-float pointer-events-none absolute z-[2] text-[#D85A30]"
        style={{
          bottom: '10%',
          left: '6%',
          ['--r']: '35deg',
          opacity: 0.18,
          animationDelay: '3s',
        }}
        aria-hidden
      />
      <GiPawPrint
        size={36}
        className="paw-spin-float pointer-events-none absolute z-[2] text-[#D85A30]"
        style={{
          bottom: '12%',
          right: '6%',
          ['--r']: '-15deg',
          opacity: 0.2,
          animationDelay: '2s',
        }}
        aria-hidden
      />

      <div className="relative z-[3] mx-auto flex w-full max-w-5xl flex-col items-center px-8 py-10 text-center md:px-32 md:py-12">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[2.5px] text-[#E05C2A]">
          Trusted pet professionals
        </p>
        <h1 className="w-full font-black uppercase leading-tight tracking-tighter">
          <span className="block text-5xl text-[#1A1A1A] md:text-6xl">
            Where every
          </span>
          <span className="block text-5xl text-[#E05C2A] md:text-6xl">
            pet&apos;s care begins!
          </span>
        </h1>
        <p className="mt-4 w-full max-w-md text-center text-base leading-relaxed text-gray-600">
          Find vets, groomers, sitters and trainers near you, because your pet
          deserves the best.
        </p>
      </div>

      <div className="absolute left-8 top-8 z-[2] -rotate-6">
        <Link to="/search?type=vet" className="flex flex-col items-center gap-1">
          <div className="h-[130px] w-[130px] overflow-hidden rounded-full border-[5px] border-[#E05C2A] bg-[#f2c8b0]">
            <img
              src={publicImage(HERO_CIRCLE_IMAGES.vet)}
              alt="Vet"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#1A1A1A]">
            Vet
          </span>
        </Link>
      </div>

      <div className="absolute right-8 top-8 z-[2] -rotate-6">
        <Link to="/search?type=grooming" className="flex flex-col items-center gap-1">
          <div className="h-[80px] w-[80px] overflow-hidden rounded-full border-4 border-[#F5C842] bg-[#f5e2a0]">
            <img
              src={publicImage(HERO_CIRCLE_IMAGES.groomer)}
              alt="Groomer"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#1A1A1A]">
            Groomer
          </span>
        </Link>
      </div>

      <div className="absolute bottom-8 left-8 z-[2] -rotate-6">
        <Link to="/search?type=training" className="flex flex-col items-center gap-1">
          <div className="h-[80px] w-[80px] overflow-hidden rounded-full border-4 border-[#5CB85C] bg-[#b8ddb8]">
            <img
              src={publicImage(HERO_CIRCLE_IMAGES.trainer)}
              alt="Trainer"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#1A1A1A]">
            Trainer
          </span>
        </Link>
      </div>

      <div className="absolute bottom-8 right-8 z-[2] -rotate-6">
        <Link to="/search?type=sitting" className="flex flex-col items-center gap-1">
          <div className="h-[130px] w-[130px] overflow-hidden rounded-full border-[5px] border-[#4AABDB] bg-[#a8d4f0]">
            <img
              src={publicImage(HERO_CIRCLE_IMAGES.sitter)}
              alt="Sitter"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#1A1A1A]">
            Sitter
          </span>
        </Link>
      </div>
    </section>
  )
}
