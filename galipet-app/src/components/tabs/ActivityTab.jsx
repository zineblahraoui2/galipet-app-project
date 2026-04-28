import { useEffect, useMemo, useState } from 'react'
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
} from 'date-fns'
import { api } from '../../api/client.js'

const BRAND = '#D85A30'

function groupKey(createdAt) {
  const d = new Date(createdAt)
  if (isToday(d)) return 'today'
  if (isYesterday(d)) return 'yesterday'
  if (isThisWeek(d, { weekStartsOn: 1 })) return 'week'
  return 'earlier'
}

const GROUP_LABEL = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'This week',
  earlier: 'Earlier',
}

const GROUP_ORDER = ['today', 'yesterday', 'week', 'earlier']

function SkeletonTimeline() {
  return (
    <div className="space-y-4 pl-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 max-w-xs animate-pulse rounded bg-gray-100" style={{ width: '75%' }} />
            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ActivityRow({ activity }) {
  const when = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
  return (
    <div className="flex gap-3 border-l-2 border-orange-100 pl-4">
      <div
        className="-ml-[1.65rem] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-100 bg-white text-lg shadow-sm"
        aria-hidden
      >
        {activity.icon || '•'}
      </div>
      <div className="min-w-0 flex-1 pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-medium text-gray-900">{activity.description}</p>
          <time className="shrink-0 text-xs text-gray-400" dateTime={activity.createdAt}>
            {when}
          </time>
        </div>
        {activity.petName ? (
          <p className="mt-0.5 text-sm text-gray-600">{activity.petName}</p>
        ) : null}
      </div>
    </div>
  )
}

export default function ActivityTab() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/api/activity')
        if (!cancelled) setActivities(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) {
          setActivities([])
          setError('Could not load your activity.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const grouped = useMemo(() => {
    if (activities.length <= 5) return null
    const buckets = { today: [], yesterday: [], week: [], earlier: [] }
    for (const a of activities) {
      const k = groupKey(a.createdAt)
      buckets[k].push(a)
    }
    return buckets
  }, [activities])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Activity</h1>
        <p className="mt-1 text-sm text-gray-600">
          A timeline of what happened with your pets and bookings.
        </p>
      </div>

      {loading ? (
        <SkeletonTimeline />
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-800">
          {error}
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-orange-50/40 px-6 py-14 text-center">
          <p className="text-lg font-medium text-gray-800">No activity yet</p>
          <p className="mt-2 text-sm text-gray-600">
            Add a pet, book a service, or upload a document — we will show it here.
          </p>
        </div>
      ) : grouped ? (
        <div className="space-y-8">
          {GROUP_ORDER.map((key) => {
            const list = grouped[key]
            if (!list?.length) return null
            return (
              <section key={key}>
                <h2
                  className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  style={{ color: BRAND }}
                >
                  {GROUP_LABEL[key]}
                </h2>
                <div className="space-y-0">
                  {list.map((a) => (
                    <ActivityRow key={a._id} activity={a} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="space-y-0">
          {activities.map((a) => (
            <ActivityRow key={a._id} activity={a} />
          ))}
        </div>
      )}
    </div>
  )
}
