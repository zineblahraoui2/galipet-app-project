const MS_MIN = 60000
const MS_HOUR = 3600000
const MS_DAY = 86400000

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

/** "14:32" for today, "Mon 14:32" for this week, "28 Apr" for older */
export function formatMessageTime(date) {
  const d = date ? new Date(date) : null
  if (!d || Number.isNaN(d.getTime())) return ''
  const now = new Date()
  if (startOfDay(d) === startOfDay(now)) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const diff = now.getTime() - d.getTime()
  if (diff >= 0 && diff < 7 * MS_DAY) {
    const day = d.toLocaleDateString('en-GB', { weekday: 'short' })
    const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${day} ${t}`
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** "2m ago", "1h ago", "Yesterday", "Mon", "28 Apr" */
export function formatRelativeTime(date) {
  const d = date ? new Date(date) : null
  if (!d || Number.isNaN(d.getTime())) return ''
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < MS_MIN) return 'Just now'
  if (diff < 60 * MS_MIN) return `${Math.floor(diff / MS_MIN)}m ago`
  if (diff < 24 * MS_HOUR) return `${Math.floor(diff / MS_HOUR)}h ago`
  const yest = new Date(now)
  yest.setDate(yest.getDate() - 1)
  if (startOfDay(d) === startOfDay(yest)) return 'Yesterday'
  if (diff < 7 * MS_DAY) return d.toLocaleDateString('en-GB', { weekday: 'short' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function truncatePreview(text, maxLen = 40) {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  if (s.length <= maxLen) return s
  return `${s.slice(0, maxLen - 1)}…`
}

export function groupMessagesByDate(messages) {
  const list = Array.isArray(messages) ? messages : []
  const out = []
  let currentKey = null
  let bucket = []
  for (const m of list) {
    const d = m?.createdAt ? new Date(m.createdAt) : null
    const key = d && !Number.isNaN(d.getTime())
      ? d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'Messages'
    if (key !== currentKey) {
      if (bucket.length) out.push({ dateLabel: currentKey, messages: bucket })
      currentKey = key
      bucket = [m]
    } else {
      bucket.push(m)
    }
  }
  if (bucket.length) out.push({ dateLabel: currentKey, messages: bucket })
  return out
}

export function shouldShowAvatar(message, prevMessage) {
  if (!prevMessage) return true
  if (String(prevMessage.senderId) !== String(message.senderId)) return true
  const a = new Date(prevMessage.createdAt).getTime()
  const b = new Date(message.createdAt).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return true
  return b - a > 5 * MS_MIN
}
