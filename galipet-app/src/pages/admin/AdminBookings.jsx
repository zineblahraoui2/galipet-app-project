import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'

function ownerName(owner) {
  if (!owner || typeof owner !== 'object') return 'Owner'
  const n = String(owner.name || '').trim()
  if (n) return n
  return [owner.firstName, owner.lastName].filter(Boolean).join(' ').trim() || 'Owner'
}

export default function AdminBookings() {
  const [status, setStatus] = useState('all')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(nextStatus = status) {
    setLoading(true)
    setError('')
    try {
      const params = nextStatus === 'all' ? {} : { status: nextStatus }
      const { data } = await api.get('/api/admin/bookings', { params })
      setRows(Array.isArray(data?.bookings) ? data.bookings : [])
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function cancelBooking(id) {
    try {
      await api.patch(`/api/admin/bookings/${id}/cancel`)
      setRows((prev) => prev.map((b) => (String(b._id) === String(id) ? { ...b, status: 'cancelled' } : b)))
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to cancel booking.')
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Bookings</h1>
            <p className="text-sm text-gray-600">Monitor and manage booking statuses.</p>
          </div>
          <select
            value={status}
            onChange={(e) => {
              const next = e.target.value
              setStatus(next)
              load(next)
            }}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </section>
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Professional</th>
                  <th className="py-2 pr-3">Service</th>
                  <th className="py-2 pr-3">Start</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b._id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3 font-medium text-gray-800">{ownerName(b.owner)}</td>
                    <td className="py-2 pr-3 text-gray-700">{b.professional?.name || 'Professional'}</td>
                    <td className="py-2 pr-3 text-gray-700">{b.serviceName}</td>
                    <td className="py-2 pr-3 text-gray-700">{b.startAt ? new Date(b.startAt).toLocaleString('en-GB') : '—'}</td>
                    <td className="py-2 pr-3 capitalize">{b.status}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => cancelBooking(b._id)}
                        disabled={String(b.status) === 'cancelled'}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
