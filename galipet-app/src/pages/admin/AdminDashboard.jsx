import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react'
import { api } from '../../api/client.js'
import AdminStatCard from '../../components/admin/AdminStatCard.jsx'
import { BookingsLineChart, UsersBarChart } from '../../components/admin/AdminCharts.jsx'

function ownerName(owner) {
  if (!owner || typeof owner !== 'object') return 'Owner'
  const n = String(owner.name || '').trim()
  if (n) return n
  return [owner.firstName, owner.lastName].filter(Boolean).join(' ').trim() || 'Owner'
}

function statusPillClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'completed') return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  if (s === 'confirmed') return 'bg-blue-100 text-blue-700 border border-blue-200'
  if (s === 'cancelled') return 'bg-red-100 text-red-700 border border-red-200'
  return 'bg-[#FEF3EE] text-[#E05C2A] border border-[#F5D7CA]'
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chartYear, setChartYear] = useState('2026')

  useEffect(() => {
    let ignore = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [s, b] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/bookings', { params: { limit: 5 } }),
        ])
        if (ignore) return
        setStats(s.data || null)
        setRecentBookings(Array.isArray(b.data?.bookings) ? b.data.bookings : [])
      } catch (e) {
        if (!ignore) setError(e?.response?.data?.message || e?.message || 'Failed to load admin dashboard.')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [])

  const revenue = useMemo(() => `${Math.round(Number(stats?.revenueMonth) || 0)} MAD`, [stats?.revenueMonth])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, Admin</h1>
        <p className="mt-1 text-sm text-gray-600">Platform overview</p>
      </section>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Total Users" value={loading ? '...' : Number(stats?.users || 0)} />
        <AdminStatCard title="Active Professionals" value={loading ? '...' : Number(stats?.professionals || 0)} />
        <AdminStatCard title="Bookings Today" value={loading ? '...' : Number(stats?.bookingsToday || 0)} />
        <AdminStatCard title="Monthly Revenue" value={loading ? '...' : revenue} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Recent bookings</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
              <Clock3 className="h-3.5 w-3.5" />
              Latest
            </span>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-gray-500">Loading…</p>
          ) : recentBookings.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No bookings yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {recentBookings.map((b) => (
                <li key={b._id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-3 py-3 text-sm">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-gray-800">{ownerName(b.owner)}</p>
                    <p className="truncate text-xs font-medium text-gray-500">{b.serviceName || 'Service'}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs font-medium text-gray-500">{b.startAt ? new Date(b.startAt).toLocaleDateString('en-GB') : '—'}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${statusPillClass(b.status)}`}>
                      {String(b.status || 'pending')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Quick alerts</h2>
          <div className="mt-4 space-y-3">
            <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-medium text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              {Number(stats?.pendingProfessionals || 0)} pending professionals
            </p>
            <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-medium text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {Number(stats?.failedPayments || 0)} failed payments
            </p>
            <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              System is healthy
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Bookings &amp; Revenue
            </h3>
            <select
              value={chartYear}
              onChange={(e) => setChartYear(String(e.target.value))}
              className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none transition focus:border-[#E05C2A] focus:ring-2 focus:ring-[#E05C2A]/20"
            >
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <BookingsLineChart year={chartYear} />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Users by Role
          </h3>
          <UsersBarChart />
        </div>
      </section>
    </div>
  )
}
