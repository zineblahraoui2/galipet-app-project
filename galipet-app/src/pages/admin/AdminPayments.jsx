import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'

export default function AdminPayments() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/api/admin/payments')
        if (ignore) return
        setRows(Array.isArray(data?.payments) ? data.payments : [])
      } catch (e) {
        if (!ignore) setError(e?.response?.data?.message || e?.message || 'Failed to load payments.')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-600">Stripe subscription status across users.</p>
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
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Stripe Customer</th>
                  <th className="py-2">Stripe Subscription</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const failed = ['past_due', 'unpaid', 'incomplete_expired'].includes(String(r.status || '').toLowerCase())
                  return (
                    <tr key={r._id} className={`border-b last:border-b-0 ${failed ? 'bg-red-50/40' : ''}`}>
                      <td className="py-2 pr-3">
                        <p className="font-medium text-gray-800">{r.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{r.email}</p>
                      </td>
                      <td className="py-2 pr-3 capitalize text-gray-700">{r.plan || 'free'}</td>
                      <td className="py-2 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${failed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {r.status || 'inactive'}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs text-gray-600">{r.stripeCustomerId || '—'}</td>
                      <td className="py-2 text-xs text-gray-600">{r.stripeSubscriptionId || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
