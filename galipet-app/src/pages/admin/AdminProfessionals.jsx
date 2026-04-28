import { useEffect, useMemo, useState } from 'react'
import { Search, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client.js'

export default function AdminProfessionals() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/admin/professionals')
      setRows(Array.isArray(data?.professionals) ? data.professionals : [])
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load professionals.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function action(id, type) {
    try {
      await api.patch(`/api/admin/professionals/${id}/${type}`)
      setRows((prev) =>
        prev.map((p) =>
          String(p._id) === String(id)
            ? {
                ...p,
                verificationStatus: type === 'approve' ? 'verified' : 'rejected',
                isVerified: type === 'approve',
              }
            : p,
        ),
      )
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Action failed.')
    }
  }

  const filtered = useMemo(() => {
    const q = String(query || '').trim().toLowerCase()
    return rows.filter((p) => {
      const status = String(p?.verificationStatus || 'pending').toLowerCase()
      const byStatus = statusFilter === 'all' ? true : status === statusFilter
      if (!byStatus) return false
      if (!q) return true
      return [
        String(p?.name || ''),
        String(p?.specialty || ''),
        String(p?.city || ''),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [rows, query, statusFilter])

  const stats = useMemo(() => {
    const total = rows.length
    const verified = rows.filter((p) => Boolean(p?.isVerified)).length
    const pending = rows.filter((p) => String(p?.verificationStatus || '').toLowerCase() === 'pending').length
    const activeToday = 0
    return { total, verified, pending, activeToday }
  }, [rows])

  function specialtyBadgeClass(specialty) {
    const s = String(specialty || '').toLowerCase()
    if (s === 'vet') return 'bg-blue-50 text-blue-600'
    if (s === 'grooming') return 'bg-yellow-50 text-yellow-600'
    if (s === 'sitting') return 'bg-green-50 text-green-600'
    if (s === 'training') return 'bg-purple-50 text-purple-600'
    return 'bg-gray-100 text-gray-600'
  }

  function statusBadgeClass(status) {
    const s = String(status || '').toLowerCase()
    if (s === 'verified') return 'bg-green-50 text-green-600'
    if (s === 'rejected') return 'bg-red-50 text-red-500'
    return 'bg-yellow-50 text-yellow-600'
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Pros', value: stats.total, percent: 5 },
          { label: 'Verified', value: stats.verified, percent: 4 },
          { label: 'Pending Review', value: stats.pending, percent: 2 },
          { label: 'Active Today', value: stats.activeToday, percent: 1 },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-start justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-400">{item.label}</p>
              <span className="text-xs font-medium text-green-500">+{item.percent}%</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-800">{loading ? '...' : item.value}</p>
          </div>
        ))}
      </section>
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative w-full flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-[#E05C2A] focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <span className="ml-auto text-xs text-gray-400">{filtered.length} results</span>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div
              className="grid gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-400"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}
            >
              <span>Name</span>
              <span>Specialty</span>
              <span>City</span>
              <span>Rating</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {filtered.map((p) => {
              const status = String(p?.verificationStatus || 'pending').toLowerCase()
              const isPending = status === 'pending'
              return (
                <div
                  key={p._id}
                  className="grid items-center gap-4 border-b border-gray-50 px-5 py-3.5 transition-colors hover:bg-gray-50/50"
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FEE9DF] text-xs font-medium text-[#E05C2A]">
                      {String(p?.name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate text-sm font-medium text-gray-800">{p.name || '—'}</span>
                  </div>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize ${specialtyBadgeClass(p.specialty)}`}>
                    {p.specialty || '—'}
                  </span>
                  <span className="text-sm text-gray-500">{p.city || '—'}</span>
                  <span className="text-sm text-gray-500">⭐ {p.rating ?? 'N/A'}</span>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusBadgeClass(status)}`}>
                    {status}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => action(p._id, 'approve')}
                          className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-600 transition-colors hover:bg-green-50"
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => action(p._id, 'reject')}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => navigate(`/professionals/${p._id}`)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      View
                    </button>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <UserCheck size={32} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-400">No professionals found</p>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  )
}
