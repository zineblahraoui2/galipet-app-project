function appointmentStart(booking) {
  const d = booking?.startAt ? new Date(booking.startAt) : null
  if (!d || Number.isNaN(d.getTime())) return null
  return d
}

/** End of session: start + durationMinutes + late buffer (minutes). */
function appointmentEnd(booking, sessionMinutes = 60) {
  const start = appointmentStart(booking)
  if (!start) return null
  const end = new Date(start)
  const late = Math.max(0, Math.min(180, Number(booking.lateMinutes) || 0))
  end.setMinutes(end.getMinutes() + sessionMinutes + late)
  return end
}

module.exports = { appointmentStart, appointmentEnd }
