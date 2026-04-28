const Review = require('../models/Review')

/**
 * When a booking becomes completed, open the bidirectional review window (idempotent).
 */
async function ensureReviewWindowForBooking(booking) {
  if (!booking?.professional?.userId || !booking.owner) return
  try {
    const windowExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    await Review.findOneAndUpdate(
      { bookingId: booking._id },
      {
        $setOnInsert: {
          bookingId: booking._id,
          ownerId: booking.owner,
          professionalId: booking.professional.userId,
          windowExpiresAt,
          isRevealed: false,
        },
      },
      { upsert: true },
    )
  } catch (err) {
    console.error('[ensureReviewWindow]', err.message)
  }
}

module.exports = { ensureReviewWindowForBooking }
