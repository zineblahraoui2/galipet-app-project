const mongoose = require('mongoose')
const { Schema } = mongoose

const OWNER_TAG_ENUM = [
  'great_with_anxious_pets',
  'handles_large_dogs',
  'very_gentle',
  'explains_clearly',
  'clean_space',
  'on_time',
  'goes_above_and_beyond',
  'would_recommend',
]

const PRO_TAG_ENUM = [
  'punctual',
  'clear_instructions',
  'well_behaved_pet',
  'responsive',
  'respectful',
  'would_accept_again',
]

const criteriaSchema = new Schema(
  {
    expertise: { type: Number, min: 1, max: 5, default: null },
    punctuality: { type: Number, min: 1, max: 5, default: null },
    communication: { type: Number, min: 1, max: 5, default: null },
    value: { type: Number, min: 1, max: 5, default: null },
  },
  { _id: false },
)

const ownerReviewSchema = new Schema(
  {
    rating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, maxlength: 1000, default: '' },
    criteria: { type: criteriaSchema, default: () => ({}) },
    tags: [{ type: String, enum: OWNER_TAG_ENUM }],
    wouldBookAgain: { type: Boolean, default: null },
    submittedAt: { type: Date, default: null },
    proResponse: { type: String, maxlength: 500, default: '' },
    proRespondedAt: { type: Date, default: null },
  },
  { _id: false },
)

const proReviewSchema = new Schema(
  {
    rating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, maxlength: 500, default: '' },
    tags: [{ type: String, enum: PRO_TAG_ENUM }],
    wouldAcceptAgain: { type: Boolean, default: null },
    submittedAt: { type: Date, default: null },
  },
  { _id: false },
)

const ReviewSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    professionalId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerReview: { type: ownerReviewSchema, default: () => ({}) },
    proReview: { type: proReviewSchema, default: () => ({}) },
    windowExpiresAt: { type: Date, required: true },
    isRevealed: { type: Boolean, default: false },
  },
  { timestamps: true },
)

ReviewSchema.index({ professionalId: 1 })
ReviewSchema.index({ ownerId: 1 })

module.exports = mongoose.model('Review', ReviewSchema)
