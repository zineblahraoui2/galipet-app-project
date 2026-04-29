/**
 * Build local appointment Date from a calendar day + HH:mm (owner booking UI).
 * Accepts `YYYY-MM-DD` or any value parseable by `Date`.
 */
export function combineDateAndTimeSlot(dateValue, timeSlot) {
  if (dateValue == null || dateValue === '') return null
  const raw = String(dateValue).trim()
  const slot = String(timeSlot || '09:00').trim()
  const [hh = 9, mm = 0] = slot.split(':').map((n) => parseInt(n, 10))
  const h = Number.isNaN(hh) ? 9 : hh
  const m = Number.isNaN(mm) ? 0 : mm
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, mo, da] = raw.split('-').map((x) => parseInt(x, 10))
    return new Date(y, mo - 1, da, h, m, 0, 0)
  }
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0)
}

/** Map API booking rows to fields the owner UI expects (date / timeSlot / serviceType). */
export function enrichOwnerBookingForDisplay(b) {
  if (!b || typeof b !== 'object') return b
  const out = { ...b }
  if (!out.serviceType) {
    out.serviceType = out.professional?.specialty || 'vet'
  }
  if ((!out.date || !out.timeSlot) && out.startAt) {
    const start = new Date(out.startAt)
    if (!Number.isNaN(start.getTime())) {
      out.timeSlot = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
      out.date = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        12,
        0,
        0,
        0,
      ).toISOString()
    }
  }
  return out
}
