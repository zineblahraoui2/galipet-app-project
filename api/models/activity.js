const mongoose = require('mongoose')
const { Schema } = mongoose

const ActivitySchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'pet_added',
        'pet_updated',
        'pet_removed',
        'booking_created',
        'booking_confirmed',
        'booking_cancelled',
        'booking_completed',
        'vaccine_added',
        'document_uploaded',
      ],
    },
    description: { type: String, default: '', trim: true },
    petName: { type: String, default: '', trim: true },
    icon: { type: String, default: '', trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
)

module.exports = mongoose.model('Activity', ActivitySchema)
