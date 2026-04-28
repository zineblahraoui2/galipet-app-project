const mongoose = require('mongoose')
const { Schema } = mongoose

const MessageSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    professionalId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', default: null, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 2000, trim: true },
    readAt: { type: Date, default: null },
    isSystem: { type: Boolean, default: false },
    systemType: {
      type: String,
      enum: ['booking_confirmed', 'booking_cancelled', 'booking_completed', 'reminder_24h'],
    },
  },
  { timestamps: true },
)

MessageSchema.index({ ownerId: 1, professionalId: 1, createdAt: -1 })

module.exports = mongoose.model('Message', MessageSchema)
