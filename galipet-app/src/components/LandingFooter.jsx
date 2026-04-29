import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa'

const copy = {
  en: {
    tagline: 'Care for every paw, peace of mind for every parent.',
    navTitle: 'Navigation',
    home: 'Home',
    search: 'Find a pro',
    register: 'Sign up',
    login: 'Log in',
    contactTitle: 'Contact',
    contactHint: 'Questions or partnerships?',
    emailCta: 'Write to us',
    proCta: 'Pro space',
    legalCgu: 'Terms of use',
    legalMentions: 'Legal notice',
    legalPrivacy: 'Privacy policy',
  },
  fr: {
    tagline: 'Des soins pour chaque patte, une tranquillité d’esprit pour chaque parent.',
    navTitle: 'Navigation',
    home: 'Accueil',
    search: 'Trouver un pro',
    register: 'Créer un compte',
    login: 'Connexion',
    contactTitle: 'Contact',
    contactHint: 'Questions ou partenariats ?',
    emailCta: 'Nous écrire',
    proCta: 'Espace pro',
    legalCgu: 'CGU',
    legalMentions: 'Mentions légales',
    legalPrivacy: 'Politique de confidentialité',
  },
}

export default function LandingFooter({ lang = 'en' }) {
  const t = copy[lang === 'fr' ? 'fr' : 'en']

  return (
    <footer className="w-full min-w-0 border-t border-[#EADFD6] bg-[#FDF6EE] text-[#1a1a1a]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8 lg:px-12">
        <div className="grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-12">
          <div className="md:pr-4">
            <p className="text-2xl font-semibold italic text-[#E05C2A]">gali&apos;pet</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-600">{t.tagline}</p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#EADFD6] text-gray-600 transition hover:border-[#E05C2A] hover:text-[#E05C2A]"
                aria-label="Instagram"
              >
                <FaInstagram className="h-4 w-4" aria-hidden />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#EADFD6] text-gray-600 transition hover:border-[#E05C2A] hover:text-[#E05C2A]"
                aria-label="Facebook"
              >
                <FaFacebook className="h-4 w-4" aria-hidden />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#EADFD6] text-gray-600 transition hover:border-[#E05C2A] hover:text-[#E05C2A]"
                aria-label="X (Twitter)"
              >
                <FaTwitter className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>

          <div className="border-t border-[#EADFD6] pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-8 lg:pl-12">
            <p className="text-xs font-bold uppercase tracking-[2px] text-[#E05C2A]">{t.navTitle}</p>
            <nav className="mt-4 flex flex-col gap-2 text-sm font-medium text-gray-700">
              <Link to="/" className="transition hover:text-[#E05C2A]">
                {t.home}
              </Link>
              <Link to="/search" className="transition hover:text-[#E05C2A]">
                {t.search}
              </Link>
              <Link to="/register" className="transition hover:text-[#E05C2A]">
                {t.register}
              </Link>
              <Link to="/login" className="transition hover:text-[#E05C2A]">
                {t.login}
              </Link>
            </nav>
          </div>

          <div className="border-t border-[#EADFD6] pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-8 lg:pl-12">
            <p className="text-xs font-bold uppercase tracking-[2px] text-[#E05C2A]">{t.contactTitle}</p>
            <p className="mt-3 text-sm text-gray-600">{t.contactHint}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap md:flex-col lg:flex-row">
              <a
                href="mailto:contact@galipet.com"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#EADFD6] bg-[#FBF7F0] px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] transition hover:border-[#E05C2A] hover:bg-[#FEF3EE]"
              >
                <Mail className="h-4 w-4 text-[#E05C2A]" strokeWidth={2} />
                {t.emailCta}
              </a>
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {t.proCta}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-[#EADFD6] pt-8 text-xs text-gray-500">
          <a href="#cgu" className="transition hover:text-[#E05C2A]" onClick={(e) => e.preventDefault()}>
            {t.legalCgu}
          </a>
          <span className="text-gray-300" aria-hidden>
            ·
          </span>
          <a href="#mentions" className="transition hover:text-[#E05C2A]" onClick={(e) => e.preventDefault()}>
            {t.legalMentions}
          </a>
          <span className="text-gray-300" aria-hidden>
            ·
          </span>
          <a href="#confidentialite" className="transition hover:text-[#E05C2A]" onClick={(e) => e.preventDefault()}>
            {t.legalPrivacy}
          </a>
        </div>
      </div>
    </footer>
  )
}
