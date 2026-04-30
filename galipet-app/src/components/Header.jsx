import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Home,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  PawPrint,
  Search,
  Settings,
  User,
  UserPlus,
} from 'lucide-react'
import { UserContext } from '../UserContext.jsx'
import { MessagesUnreadContext } from '../MessagesUnreadContext.jsx'

const servicePills = [
  { label: 'Vets', type: 'vet' },
  { label: 'Groomers', type: 'grooming' },
  { label: 'Sitters', type: 'sitting' },
  { label: 'Trainers', type: 'training' },
]

const accountNavItems = [
  { to: '/home', label: 'Home', Icon: Home },
  { to: '/account', label: 'My profile', Icon: User },
  { to: '/account/pets', label: 'My pets', Icon: PawPrint },
  { to: '/account/bookings', label: 'My bookings', Icon: Calendar },
  { to: '/messages', label: 'Messages', Icon: MessageCircle, ownerOnly: true },
  { to: '/account/notifications', label: 'Settings', Icon: Settings },
]

function displayName(user) {
  const n = user?.name?.trim()
  if (n) return n
  return user?.email ?? ''
}

function avatarInitials(user) {
  const name = displayName(user)
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'G'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function isActivePath(currentPath, itemPath) {
  if (itemPath === '/account') return currentPath === '/account'
  if (itemPath === '/messages') return currentPath === '/messages'
  return currentPath.startsWith(itemPath)
}

function MenuItem({ icon: Icon, label, onClick, danger = false, badge = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors duration-100 hover:bg-gray-50 ${
        danger ? 'text-[#E05C2A]' : 'text-gray-700'
      }`}
    >
      <Icon size={15} className={danger ? 'text-[#E05C2A]' : 'text-gray-400'} />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded-full bg-[#E05C2A] px-2 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  )
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, authReady, logout } = useContext(UserContext)
  const { unreadCount } = useContext(MessagesUnreadContext)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const menuRef = useRef(null)
  const searchParams = new URLSearchParams(location.search)
  const activeType =
    location.pathname === '/search'
      ? String(searchParams.get('type') || '').toLowerCase()
      : ''

  const onAuthForm =
    location.pathname === '/login' || location.pathname === '/register'

  const showSignedIn = Boolean(authReady && user && !onAuthForm)
  const userBadge = useMemo(() => {
    const plan = String(user?.plan || '').trim()
    if (!plan) return 'FREE'
    return plan.toUpperCase()
  }, [user?.plan])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setSidebarOpen(false)
    })
    return () => cancelAnimationFrame(id)
  }, [location.pathname, location.search])

  useEffect(() => {
    function handleClick(event) {
      if (!menuRef.current?.contains(event.target)) {
        setSidebarOpen(false)
      }
    }
    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [sidebarOpen])

  async function handleLogout() {
    localStorage.removeItem('token')
    await logout?.()
    setSidebarOpen(false)
    navigate('/', { replace: true })
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="flex h-16 w-full max-w-none items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://galipet-web.com/logo-galipet-orange.svg"
              alt="Galipet logo"
              className="h-9 w-9"
            />
            <span className="text-2xl font-semibold italic text-[#c2410c]">
              gali’pet
            </span>
          </Link>

          <div className="hidden flex-wrap items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm transition hover:shadow-md md:flex md:gap-4 md:px-5">
            {servicePills.map((service, index) => (
              <div key={service.type} className="flex items-center gap-4">
                <Link
                  to={`/search?type=${service.type}`}
                  className={[
                    'rounded-full px-2 py-1 text-sm font-medium transition',
                    activeType === service.type
                      ? 'text-[#D85A30]'
                      : 'text-gray-700 hover:text-[#D85A30]',
                  ].join(' ')}
                >
                  {service.label}
                </Link>
                {index < servicePills.length - 1 && (
                  <span className="h-4 border-l border-gray-300" aria-hidden />
                )}
              </div>
            ))}

            <Link to="/search" aria-label="Search" className="ml-2 rounded-full bg-[#c2410c] p-1 text-white transition hover:bg-orange-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </Link>
          </div>

          {showSignedIn && String(user?.role || '') === 'owner' ? (
            <Link
              to="/messages"
              className="relative hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:border-[#D85A30]/40 hover:text-[#D85A30] lg:flex"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Messages
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#E05C2A] px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </Link>
          ) : null}

          <div className="flex items-center gap-2">
            <Link
              to="/search"
              aria-label="Search"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:text-[#D85A30] md:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex min-h-11 max-w-[min(100vw-8rem,20rem)] items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm transition hover:shadow-md md:gap-3 md:px-4"
              aria-label={
                showSignedIn
                  ? `Open account menu — ${displayName(user)}`
                  : 'Open account menu'
              }
            >
              <span className="text-gray-700" aria-hidden>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5 shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </span>
            <span className="flex shrink-0 items-center justify-center rounded-full border border-gray-200 bg-[#c2410c] p-1 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 21.75c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
              {showSignedIn ? (
                <span className="hidden min-w-0 truncate text-sm font-medium text-gray-800 sm:inline">
                  {displayName(user)}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      <aside
        ref={menuRef}
        className={`absolute right-4 top-16 z-50 w-[260px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl transition-all duration-150 ${
          sidebarOpen
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        }`}
        style={{ transformOrigin: 'top right' }}
        aria-label="Account menu panel"
      >
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-lg font-semibold italic text-[#E05C2A]">gali&apos;pet</p>
        </div>

        {!showSignedIn ? (
          <div className="p-3">
            <div className="space-y-1">
              <MenuItem icon={Search} label="Search professionals" onClick={() => { setSidebarOpen(false); navigate('/search') }} />
              <MenuItem icon={MapPin} label="Find near me" onClick={() => { setSidebarOpen(false); navigate('/search') }} />
            </div>
            <div className="my-2 border-t border-gray-100" />
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false)
                  navigate('/login')
                }}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <LogIn className="h-4 w-4 text-gray-500" />
                Log in
              </button>
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false)
                  navigate('/register')
                }}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#E05C2A] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#c94e22]"
              >
                <UserPlus className="h-4 w-4 text-white" />
                Sign up — it&apos;s free
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D85A30] text-sm font-semibold text-white">
                {avatarInitials(user)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {displayName(user)} · {userBadge}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user?.email || ''}</p>
                </div>
              </div>
            </div>
            <nav className="p-3">
              {accountNavItems
                .filter((item) => !item.ownerOnly || String(user?.role || '') === 'owner')
                .map((item) => {
                  const { to, label, Icon: ItemIcon } = item
                  const badge =
                    to === '/messages' && unreadCount > 0
                      ? unreadCount > 99 ? '99+' : String(unreadCount)
                      : ''
                  return (
                    <MenuItem
                      key={to}
                      icon={ItemIcon}
                      label={label}
                      badge={badge}
                      onClick={() => {
                        setSidebarOpen(false)
                        navigate(to)
                      }}
                    />
                  )
                })}
            </nav>
            <div className="mx-3 border-t border-gray-100" />
            <div className="p-3">
              <MenuItem icon={LogOut} label="Log out" danger onClick={handleLogout} />
            </div>
          </>
        )}
      </aside>
    </>
  )
}
