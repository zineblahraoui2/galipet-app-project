const mongoose = require('mongoose')
const { Schema } = mongoose

const ProfessionalSnapshotSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    specialty: {
      type: String,
      enum: ['vet', 'grooming', 'sitting', 'training'],
      required: true,
    },
    location: { type: String, default: '', trim: true },
  },
  { _id: false },
)

const BookingSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    professional: { type: ProfessionalSnapshotSchema, required: true },
    pet: { type: Schema.Types.ObjectId, ref: 'Pet', required: true },
    serviceId: { type: Schema.Types.ObjectId, default: null, required: false },
    serviceName: { type: String, default: '', trim: true, required: false },
    duration: { type: Number, default: null },
    startAt: { type: Date, required: true },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'completed',
        'cancelled',
        'late',
        'no_show',
        'rescheduled',
      ],
      default: 'pending',
    },
    price: { type: Number },
    notes: { type: String, default: '', trim: true },
    cancelledBy: {
      type: String,
      enum: ['owner', 'professional'],
    },
    cancelReason: { type: String, default: '', trim: true },
    lateReportedBy: {
      type: String,
      enum: ['owner', 'professional'],
    },
    lateMinutes: { type: Number, default: 0 },
    noShowReportedBy: {
      type: String,
      enum: ['owner', 'professional'],
    },
    reminderSent: { type: Boolean, default: false },
    rescheduleHistory: [
      {
        previousStartAt: { type: Date },
        changedBy: { type: String, enum: ['owner', 'professional'] },
        changedAt: { type: Date, default: Date.now },
        reason: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true },
)

BookingSchema.index({ 'professional.userId': 1 })

module.exports = mongoose.model('Booking', BookingSchema)
