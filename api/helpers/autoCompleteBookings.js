const Booking = require('../models/bookings')
const { appointmentEnd } = require('./appointmentTime')
const { ensureReviewWindowForBooking } = require('./ensureReviewWindow')

/**
 * Marks bookings completed once session end (incl. late buffer) has passed.
 * Run periodically from the API process (see api/index.js).
 */
async function autoCompleteBookings() {
  const now = new Date()
  const bookings = await Booking.find({
    status: { $in: ['confirmed', 'late', 'rescheduled'] },
  })
    .select('_id startAt lateMinutes status owner professional')
    .lean()

  let updated = 0
  for (const booking of bookings) {
    const end = appointmentEnd(booking, 60)
    if (!end || now <= end) continue
    await Booking.findByIdAndUpdate(booking._id, { $set: { status: 'completed' } })
    updated += 1
    const fresh = await Booking.findById(booking._id).lean()
    if (fresh) await ensureReviewWindowForBooking(fresh)
  }
  if (updated > 0) {
    console.log(`[autoCompleteBookings] marked ${updated} booking(s) completed`)
  }
}

module.exports = autoCompleteBookings
