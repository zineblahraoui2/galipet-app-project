import { useContext, useEffect, useMemo, useState } from 'react'
import { Search, Trash2, Users } from 'lucide-react'
import { api } from '../../api/client.js'
import { UserContext } from '../../UserContext.jsx'

export default function AdminUsers() {
  const { user: sessionUser } = useContext(UserContext)
  const [role, setRole] = useState('all')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  async function load(nextRole = role, { showSpinner = true } = {}) {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      const params = nextRole === 'all' ? {} : { role: nextRole }
      const { data } = await api.get('/api/admin/users', { params })
      setRows(Array.isArray(data?.users) ? data.users : [])
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load users.')
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  function userRowId(u) {
    const v = u?._id ?? u?.id
    return v == null ? '' : String(v)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggleSuspend(userId, suspendedNow) {
    try {
      await api.patch(`/api/admin/users/${encodeURIComponent(String(userId))}/suspend`, { suspended: !suspendedNow })
      setRows((prev) =>
        prev.map((u) => (userRowId(u) === String(userId) ? { ...u, suspended: !suspendedNow } : u)),
      )
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to update user.')
    }
  }

  async function deleteUser(userId, displayName) {
    const id = String(userId || '').trim()
    if (!id) {
      setError('Missing user id — refresh the page and try again.')
      return
    }
    const ok = window.confirm(
      `Permanently remove ${displayName || 'this user'} from the database? This cannot be undone.`,
    )
    if (!ok) return
    setError('')
    setDeletingId(id)
    try {
      await api.delete(`/api/admin/users/${encodeURIComponent(id)}`)
      setRows((prev) => prev.filter((u) => userRowId(u) !== id))
      await load(role, { showSpinner: false })
    } catch (e) {
      const status = e?.response?.status
      if (status === 404) {
        setRows((prev) => prev.filter((u) => userRowId(u) !== id))
        await load(role, { showSpinner: false })
        return
      }
      setError(e?.response?.data?.message || e?.message || 'Failed to delete user.')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = String(query || '').trim().toLowerCase()
    return rows.filter((u) => {
      const isSuspended = Boolean(u?.suspended)
      const byStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? !isSuspended
            : isSuspended
      if (!byStatus) return false
      if (!q) return true
      const name = String(u?.name || '').toLowerCase()
      const email = String(u?.email || '').toLowerCase()
      const plan = String(u?.plan || '').toLowerCase()
      const roleText = String(u?.role || '').toLowerCase()
      return name.includes(q) || email.includes(q) || plan.includes(q) || roleText.includes(q)
    })
  }, [rows, query, statusFilter])

  const stats = useMemo(() => {
    const total = rows.length
    const owners = rows.filter((u) => String(u?.role || '').toLowerCase() === 'owner').length
    const professionals = rows.filter((u) => String(u?.role || '').toLowerCase() === 'professional').length
    const suspended = rows.filter((u) => Boolean(u?.suspended)).length
    return { total, owners, professionals, suspended }
  }, [rows])

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Users', value: stats.total, percent: 4 },
          { label: 'Owners', value: stats.owners, percent: 3 },
          { label: 'Professionals', value: stats.professionals, percent: 5 },
          { label: 'Suspended', value: stats.suspended, percent: 1 },
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
            value={role}
            onChange={(e) => {
              const next = e.target.value
              setRole(next)
              load(next)
            }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All roles</option>
            <option value="owner">Owner</option>
            <option value="professional">Professional</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <span className="ml-auto text-xs text-gray-400">{filtered.length} results</span>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div
              className="grid gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-400"
              style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr' }}
            >
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Plan</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {filtered.map((u) => {
              const rowId = userRowId(u)
              const isSuspended = Boolean(u?.suspended)
              const roleText = String(u?.role || 'owner').toLowerCase()
              const isSelf = sessionUser?.id != null && String(sessionUser.id) === rowId
              const canDelete = roleText !== 'admin' && !isSelf && rowId
              return (
                <div
                  key={rowId || u.email}
                  className="grid items-center gap-4 border-b border-gray-50 px-5 py-3.5 transition-colors hover:bg-gray-50/50"
                  style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FEE9DF] text-xs font-medium text-[#E05C2A]">
                      {String(u?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate text-sm font-medium text-gray-800">{u.name || '—'}</span>
                  </div>
                  <span className="truncate text-sm text-gray-500">{u.email || '—'}</span>
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                      roleText === 'admin'
                        ? 'bg-purple-50 text-purple-600'
                        : roleText === 'professional'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-orange-50 text-[#E05C2A]'
                    }`}
                  >
                    {roleText}
                  </span>
                  <span className="text-sm text-gray-500">{u.plan || 'Free'}</span>
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                      isSuspended ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                    }`}
                  >
                    {isSuspended ? 'Suspended' : 'Active'}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={Boolean(deletingId)}
                      onClick={() => toggleSuspend(rowId, isSuspended)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                        isSuspended
                          ? 'border-green-200 text-green-600 hover:bg-green-50'
                          : 'border-red-200 text-red-500 hover:bg-red-50'
                      }`}
                    >
                      {isSuspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    {canDelete ? (
                      <button
                        type="button"
                        title="Remove user from database"
                        disabled={deletingId != null}
                        onClick={() => deleteUser(rowId, u.name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 size={14} aria-hidden />
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Users size={32} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-400">No users found</p>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  )
}
