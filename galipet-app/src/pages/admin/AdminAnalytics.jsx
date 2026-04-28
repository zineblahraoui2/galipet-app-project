import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client.js'

function dayKey(dateValue) {
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export default function AdminAnalytics() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/api/admin/bookings')
        if (!ignore) setRows(Array.isArray(data?.bookings) ? data.bookings : [])
      } catch (e) {
        if (!ignore) setError(e?.response?.data?.message || e?.message || 'Failed to load analytics.')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [])

  const byDay = useMemo(() => {
    const map = new Map()
    for (const b of rows) {
      const k = dayKey(b.startAt)
      if (!k) continue
      map.set(k, (map.get(k) || 0) + 1)
    }
    return Array.from(map.entries())
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .slice(-14)
  }, [rows])

  const revenueEstimate = useMemo(() => rows.reduce((sum, b) => sum + (Number(b.price) || 0), 0), [rows])

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-600">Simple platform trends from bookings data.</p>
      </section>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Revenue estimate</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{Math.round(revenueEstimate)} MAD</p>
          <p className="mt-1 text-xs text-gray-500">Sum of visible booking prices.</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Bookings per day (last 14 days)</h2>
          {loading ? (
            <p className="mt-3 text-sm text-gray-500">Loading…</p>
          ) : byDay.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No data yet.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {byDay.map(([day, count]) => (
                <li key={day} className="flex items-center justify-between rounded-lg bg-[#FEF3EE] px-3 py-1.5">
                  <span className="text-gray-700">{day}</span>
                  <span className="font-semibold text-[#E05C2A]">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
