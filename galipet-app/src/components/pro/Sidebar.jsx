import { useContext, useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  FaCalendarAlt,
  FaClipboardList,
  FaCog,
  FaEnvelope,
  FaSignOutAlt,
  FaStar,
  FaThLarge,
  FaTools,
} from 'react-icons/fa'
import { UserContext } from '../../UserContext.jsx'
import { api } from '../../api/client.js'
import { MessagesUnreadContext } from '../../MessagesUnreadContext.jsx'

const navItems = [
  { to: '/pro/dashboard', label: 'Dashboard', Icon: FaThLarge },
  { to: '/pro/calendar', label: 'Calendar', Icon: FaCalendarAlt },
  { to: '/pro/bookings', label: 'Bookings', Icon: FaClipboardList },
  { to: '/pro/messages', label: 'Messages', Icon: FaEnvelope },
  { to: '/pro/reviews', label: 'Reviews', Icon: FaStar },
  { to: '/pro/services', label: 'Services', Icon: FaTools },
  { to: '/pro/settings', label: 'Profile & Settings', Icon: FaCog },
]

function displayName(user) {
  const n = user?.name?.trim()
  if (n) return n
  return user?.email ?? ''
}

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'GP'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useContext(UserContext)
  const { unreadCount } = useContext(MessagesUnreadContext)
  const name = displayName(user)
  const [pendingReviews, setPendingReviews] = useState(0)

  useEffect(() => {
    if (String(user?.role || '').toLowerCase() !== 'professional') {
      setPendingReviews(0)
      return undefined
    }
    let ignore = false
    api
      .get('/api/reviews/my-pending')
      .then(({ data }) => {
        if (!ignore) setPendingReviews(Number(data?.count) || 0)
      })
      .catch(() => {
        if (!ignore) setPendingReviews(0)
      })
    return () => {
      ignore = true
    }
  }, [user?.role, user?.id])

  async function handleLogout() {
    await logout?.()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <aside className="hidden w-[200px] shrink-0 flex-col border-r border-[#EADFD6] bg-white md:fixed md:inset-y-0 md:left-0 md:flex">
        <div className="border-b border-gray-100 px-4 py-5">
          <p className="text-2xl font-semibold italic text-[#E05C2A]">gali&apos;pet</p>
          <p className="mt-1 truncate text-sm text-gray-700">{name}</p>
        </div>

        <nav className="flex-1 py-3">
          {navItems.map((item) => {
            const { to, label, Icon: ItemIcon } = item
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'relative mx-2 flex min-h-11 items-center gap-3 rounded-r-xl px-4 py-3 text-sm transition',
                    isActive
                      ? 'border-l-[3px] border-[#E05C2A] bg-[#FEF3EE] font-semibold text-[#E05C2A]'
                      : 'border-l-[3px] border-transparent text-gray-700 hover:bg-[#FEF3EE]',
                  ].join(' ')
                }
              >
                <ItemIcon className="h-4 w-4 shrink-0 text-[#E05C2A]" aria-hidden />
                <span className="flex-1">{label}</span>
                {to === '/pro/messages' && unreadCount > 0 ? (
                  <span className="rounded-full bg-[#E05C2A] px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
                {to === '/pro/reviews' && pendingReviews > 0 ? (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {pendingReviews > 99 ? '99+' : pendingReviews}
                  </span>
                ) : null}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E05C2A] text-sm font-semibold text-white">
              {initials(name)}
            </div>
            <p className="truncate text-xs text-gray-600">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-[#EADFD6] px-3 py-2 text-sm font-medium text-[#E05C2A] transition hover:border-[#E05C2A]/30 hover:bg-[#FEF3EE]"
          >
            <FaSignOutAlt className="h-4 w-4 shrink-0 text-[#E05C2A]" aria-hidden />
            Log out
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#EADFD6] bg-white px-2 py-1 md:hidden">
        {navItems.slice(0, 5).map((item) => {
          const { to, label, Icon: ItemIcon } = item
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-11 flex-col items-center justify-center rounded-lg px-1 text-[11px] ${isActive ? 'text-[#E05C2A]' : 'text-gray-600'}`
              }
            >
              <ItemIcon className="h-4 w-4" aria-hidden />
              <span className="mt-0.5 truncate">{label}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
