import { useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  CalendarCheck2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ShieldUser,
  Users,
  UserRoundCheck,
} from 'lucide-react'
import { UserContext } from '../../UserContext.jsx'

const items = [
  { to: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', Icon: Users },
  { to: '/admin/professionals', label: 'Professionals', Icon: UserRoundCheck },
  { to: '/admin/bookings', label: 'Bookings', Icon: CalendarCheck2 },
  { to: '/admin/payments', label: 'Payments', Icon: CreditCard },
  { to: '/admin/analytics', label: 'Analytics', Icon: BarChart3 },
]

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'AD'
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

export default function AdminSidebar() {
  const navigate = useNavigate()
  const { user, logout } = useContext(UserContext)

  async function handleLogout() {
    localStorage.removeItem('token')
    await logout?.()
    navigate('/', { replace: true })
  }

  return (
    <>
      <aside className="hidden h-screen w-[240px] shrink-0 flex-col border-r border-[#EADFD6] bg-white md:flex">
        <div className="border-b border-gray-100 px-6 py-5">
          <p className="text-2xl font-semibold italic text-[#E05C2A]">gali&apos;pet</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#E05C2A]">Admin panel</p>
        </div>
        <nav className="flex-1 py-3">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'relative mx-2 flex items-center gap-3 rounded-r-xl px-4 py-3 text-sm transition',
                  isActive
                    ? 'border-l-[3px] border-[#E05C2A] bg-[#FEF3EE] font-semibold text-[#E05C2A]'
                    : 'border-l-[3px] border-transparent text-gray-700 hover:bg-[#FEF3EE]',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4 text-[#E05C2A]" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E05C2A] text-sm font-semibold text-white">
              {initials(user?.name || user?.email)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-gray-700">{user?.name || 'Admin'}</p>
              <p className="truncate text-[11px] text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#EADFD6] px-3 py-2 text-sm font-medium text-[#E05C2A] transition hover:bg-[#FEF3EE]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-6 border-t border-[#EADFD6] bg-white p-2 md:hidden">
        {items.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-lg py-1 text-[10px] ${isActive ? 'text-[#E05C2A]' : 'text-gray-500'}`}>
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="fixed right-3 top-3 rounded-full bg-[#FEF3EE] p-2 text-[#E05C2A] md:hidden">
        <ShieldUser className="h-4 w-4" />
      </div>
    </>
  )
}
