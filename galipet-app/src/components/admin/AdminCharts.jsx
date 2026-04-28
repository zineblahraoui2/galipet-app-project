import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../../api/client.js'

const STATIC_BOOKINGS_DATA = [
  { month: 'Jan', bookings: 0, revenue: 0 },
  { month: 'Feb', bookings: 0, revenue: 0 },
  { month: 'Mar', bookings: 0, revenue: 0 },
  { month: 'Apr', bookings: 4, revenue: 350 },
  { month: 'May', bookings: 0, revenue: 0 },
  { month: 'Jun', bookings: 0, revenue: 0 },
  { month: 'Jul', bookings: 0, revenue: 0 },
  { month: 'Aug', bookings: 0, revenue: 0 },
  { month: 'Sep', bookings: 0, revenue: 0 },
  { month: 'Oct', bookings: 0, revenue: 0 },
  { month: 'Nov', bookings: 0, revenue: 0 },
  { month: 'Dec', bookings: 0, revenue: 0 },
]

const STATIC_USERS_DATA = [
  { role: 'Owners', count: 0 },
  { role: 'Vets', count: 0 },
  { role: 'Groomers', count: 0 },
  { role: 'Sitters', count: 0 },
  { role: 'Trainers', count: 0 },
]

function ChartLoading() {
  return (
    <div className="flex h-[250px] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E05C2A] border-t-transparent" />
    </div>
  )
}

export function BookingsLineChart({ year = '2026' }) {
  const [data, setData] = useState(STATIC_BOOKINGS_DATA)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(String(year))

  useEffect(() => {
    setSelectedYear(String(year))
  }, [year])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    api
      .get('/api/admin/stats/bookings-by-month', { params: { year: selectedYear } })
      .then((res) => {
        if (ignore) return
        if (Array.isArray(res?.data?.data) && res.data.data.length > 0) {
          setData(res.data.data)
        }
      })
      .catch(() => {
        // keep static fallback silently
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [selectedYear])

  if (loading) return <ChartLoading />

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3E8DF" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="bookings"
          stroke="#E05C2A"
          strokeWidth={2}
          dot={{ fill: '#E05C2A', r: 4 }}
          name="Bookings"
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#F5C842"
          strokeWidth={2}
          dot={{ fill: '#F5C842', r: 4 }}
          name="Revenue (MAD)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function UsersBarChart() {
  const [data, setData] = useState(STATIC_USERS_DATA)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    api
      .get('/api/admin/stats/users-by-role')
      .then((res) => {
        if (ignore) return
        if (Array.isArray(res?.data?.data) && res.data.data.length > 0) {
          setData(res.data.data)
        }
      })
      .catch(() => {
        // keep static fallback silently
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [])

  if (loading) return <ChartLoading />

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3E8DF" />
        <XAxis dataKey="role" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar
          dataKey="count"
          fill="#E05C2A"
          radius={[6, 6, 0, 0]}
          name="Users"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

