const MS_DAY = 86400000

/** Monday–Sunday week containing `date` (local). */
export function getWeekDays(date) {
  const d = new Date(date)
  d.setHours(12, 0, 0, 0)
  const day = d.getDay() // 0 Sun … 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  const out = []
  for (let i = 0; i < 7; i += 1) {
    const x = new Date(monday)
    x.setDate(monday.getDate() + i)
    out.push(x)
  }
  return out
}

/** 6×7 grid of Dates for calendar month (leading/trailing days from adjacent months). Monday-first rows. */
export function getMonthGrid(date) {
  const y = date.getFullYear()
  const m = date.getMonth()
  const first = new Date(y, m, 1)
  first.setHours(12, 0, 0, 0)
  const dow = first.getDay()
  const pad = dow === 0 ? 6 : dow - 1
  const start = new Date(first)
  start.setDate(first.getDate() - pad)
  start.setHours(12, 0, 0, 0)
  const grid = []
  for (let i = 0; i < 42; i += 1) {
    const c = new Date(start)
    c.setDate(start.getDate() + i)
    grid.push(c)
  }
  return grid
}

export function dateKeyLocal(d) {
  const x = new Date(d)
  x.setHours(12, 0, 0, 0)
  const y = x.getFullYear()
  const mo = String(x.getMonth() + 1).padStart(2, '0')
  const da = String(x.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

export function getBookingsForDay(bookings, date) {
  const key = dateKeyLocal(date)
  return (bookings || []).filter((b) => {
    if (!b?.date) return false
    return dateKeyLocal(b.date) === key
  })
}

export function getBookingsForWeek(bookings, weekDays) {
  if (!weekDays?.length) return []
  const start = new Date(weekDays[0])
  start.setHours(0, 0, 0, 0)
  const end = new Date(weekDays[6])
  end.setHours(23, 59, 59, 999)
  return (bookings || []).filter((b) => {
    const t = new Date(b.date).getTime()
    return !Number.isNaN(t) && t >= start.getTime() && t <= end.getTime()
  })
}

/** First clock token HH:MM or HH:MM:SS on the string (stable for API / DB values). */
export function normalizeClock(input) {
  if (input == null || input === '') return ''
  const s = String(input).trim()
  const m = s.match(/(\d{1,2}):(\d{2})(?::\d{2})?/)
  if (!m) return ''
  const h = Math.min(23, Math.max(0, Number(m[1])))
  const mi = Math.min(59, Math.max(0, Number(m[2])))
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`
}

export function timeToMinutes(timeStr) {
  const s = normalizeClock(timeStr)
  const m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return 0
  return Number(m[1]) * 60 + Number(m[2])
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60) % 24
  const mi = Math.floor(minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`
}

export const GRID_START_HOUR = 7
export const GRID_END_HOUR = 20
export const PX_PER_HOUR = 48
export const GRID_HEIGHT_PX = (GRID_END_HOUR - GRID_START_HOUR) * PX_PER_HOUR

/** Pixel offset from top of grid (07:00 row = 0). Must match PX_PER_HOUR / GRID_START_HOUR. */
export function getSlotTop(timeStr, startHour = GRID_START_HOUR) {
  const s = normalizeClock(timeStr)
  const m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return 0
  const h = Number(m[1])
  const mi = Number(m[2])
  return (h - startHour) * PX_PER_HOUR + (mi / 60) * PX_PER_HOUR
}

export function isDateBlocked(dateStr, blockedDates) {
  const k = String(dateStr || '').slice(0, 10)
  return (blockedDates || []).some((d) => String(d).slice(0, 10) === k)
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export function weekdayKey(date) {
  return DAY_NAMES[new Date(date).getDay()]
}

export function isDayEnabled(date, weeklySchedule) {
  const key = weekdayKey(date)
  const row = weeklySchedule?.[key]
  return Boolean(row?.enabled)
}

export function getDayCapacityPercent(bookings, date, dailyCapacity) {
  const cap = Math.min(20, Math.max(1, Number(dailyCapacity) || 5))
  const dayBookings = getBookingsForDay(bookings, date).filter((b) =>
    ['pending', 'confirmed'].includes(String(b?.status || '').toLowerCase()),
  )
  return Math.min(100, Math.round((dayBookings.length / cap) * 100))
}

export function addBlockedDate(blockedDates, isoYmd) {
  const k = String(isoYmd || '').slice(0, 10)
  if (!k || blockedDates.includes(k)) return blockedDates
  return [...blockedDates, k].sort()
}

export function removeBlockedDate(blockedDates, isoYmd) {
  const k = String(isoYmd || '').slice(0, 10)
  return blockedDates.filter((d) => String(d).slice(0, 10) !== k)
}

/** Duration in minutes for a booking (default 60). */
export function bookingDurationMinutes(booking) {
  const t = String(booking?.timeSlot || '').trim()
  if (t.includes('-')) {
    const [a, b] = t.split('-').map((x) => x.trim())
    const d = timeToMinutes(b) - timeToMinutes(a)
    if (d > 0) return d
  }
  return 60
}

export function bookingStartMinutes(booking, startHour = 7) {
  const t = String(booking?.timeSlot || '').trim()
  if (t) {
    const part = t.includes('-') ? t.split('-')[0].trim() : t
    return timeToMinutes(part)
  }
  const d = new Date(booking?.date)
  if (Number.isNaN(d.getTime())) return startHour * 60
  return d.getHours() * 60 + d.getMinutes()
}

/** Layers for week/day column background (absolute px from top of grid). */
export function buildDayScheduleVisual(dayDate, weeklySchedule, blockedDates) {
  const H = GRID_HEIGHT_PX
  const key = dateKeyLocal(dayDate)
  if (isDateBlocked(key, blockedDates)) {
    return { layers: [{ kind: 'blocked', top: 0, height: H }], breakBand: null }
  }
  const wk = weekdayKey(dayDate)
  const slot = weeklySchedule?.[wk]
  if (!slot?.enabled) {
    return { layers: [{ kind: 'off', top: 0, height: H }], breakBand: null }
  }
  const gridStartMin = GRID_START_HOUR * 60
  const gridEndMin = GRID_END_HOUR * 60
  const workStartStr = normalizeClock(slot.start)
  const workEndStr = normalizeClock(slot.end)
  const workStart = timeToMinutes(workStartStr)
  const workEnd = timeToMinutes(workEndStr)
  const layers = []
  if (workStart > gridStartMin) {
    layers.push({
      kind: 'unavail',
      top: 0,
      height: getSlotTop(workStartStr),
    })
  }
  const workTop = getSlotTop(workStartStr)
  const workBottom = getSlotTop(workEndStr)
  const workH = Math.max(0, workBottom - workTop)
  layers.push({ kind: 'avail', top: workTop, height: workH })
  if (workEnd < gridEndMin) {
    layers.push({
      kind: 'unavail',
      top: workBottom,
      height: getSlotTop(`${String(GRID_END_HOUR).padStart(2, '0')}:00`) - workBottom,
    })
  }
  let breakBand = null
  const bs = normalizeClock(slot.breakStart)
  const be = normalizeClock(slot.breakEnd)
  if (bs && be) {
    const bsm = timeToMinutes(bs)
    const bem = timeToMinutes(be)
    if (bem > bsm && bsm >= workStart && bem <= workEnd) {
      breakBand = {
        top: getSlotTop(bs),
        height: getSlotTop(be) - getSlotTop(bs),
      }
    }
  }
  return { layers, breakBand }
}
