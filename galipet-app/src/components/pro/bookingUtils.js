/** API uses vet | grooming | sitting | training — map to display + pricing. */
export const SERVICE_PRICE_MAD = {
  vet: 300,
  grooming: 200,
  sitting: 150,
  training: 250,
}

export const AVATAR_COLORS = [
  'bg-red-400',
  'bg-orange-400',
  'bg-amber-400',
  'bg-green-400',
  'bg-teal-400',
  'bg-blue-400',
  'bg-purple-400',
]

export function avatarColorClass(name) {
  const s = String(name || ' ')
  const idx = Math.abs(s.charCodeAt(0)) % AVATAR_COLORS.length
  return `${AVATAR_COLORS[idx]} text-white`
}

export function servicePillClasses(serviceType) {
  const t = String(serviceType || '').toLowerCase()
  if (t === 'vet') return 'bg-blue-100 text-blue-700'
  if (t === 'grooming') return 'bg-purple-100 text-purple-700'
  if (t === 'sitting') return 'bg-green-100 text-green-700'
  if (t === 'training') return 'bg-orange-100 text-orange-700'
  return 'bg-gray-100 text-gray-700'
}

export function serviceLabel(serviceType) {
  const t = String(serviceType || '').toLowerCase()
  if (t === 'vet') return 'Vet'
  if (t === 'grooming') return 'Groomer'
  if (t === 'sitting') return 'Sitter'
  if (t === 'training') return 'Trainer'
  return t || 'Service'
}

export function statusBadgeClasses(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'pending') return 'bg-yellow-100 text-yellow-700'
  if (s === 'confirmed') return 'bg-blue-100 text-blue-700'
  if (s === 'completed') return 'bg-green-100 text-green-700'
  if (s === 'cancelled') return 'bg-gray-100 text-gray-500'
  if (s === 'late') return 'bg-orange-100 text-orange-800'
  if (s === 'no_show') return 'bg-red-100 text-red-800'
  if (s === 'rescheduled') return 'bg-sky-100 text-sky-800'
  return 'bg-gray-100 text-gray-600'
}

export function formatBookingDateTime(booking) {
  const d = booking?.date ? new Date(booking.date) : null
  if (!d || Number.isNaN(d.getTime())) return '—'
  const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = String(booking?.timeSlot || '').trim()
  if (time) return `${day} · ${time}`
  const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${t}`
}

/** Monday 00:00 — Sunday 23:59:59 local, same calendar week as `now`. */
export function isDateInThisWeek(dateValue, now = new Date()) {
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return false
  const start = new Date(now)
  const day = start.getDay() || 7
  start.setDate(start.getDate() - (day - 1))
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return d >= start && d <= end
}

export function petDisplayName(booking) {
  if (booking?.pet?.name) return booking.pet.name
  if (booking?.petName) return booking.petName
  return ''
}
