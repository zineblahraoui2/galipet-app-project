const mongoose = require('mongoose')
const { Schema } = mongoose

const WeeklyDaySlotSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' },
    breakStart: { type: String, default: '' },
    breakEnd: { type: String, default: '' },
  },
  { _id: false },
)

const ProfessionalServiceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    duration: { type: Number, default: null },
    description: { type: String, default: '', trim: true },
  },
  { _id: true },
)

const ProfessionalSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    specialty: {
      type: String,
      enum: ['vet', 'grooming', 'sitting', 'training'],
      required: true,
      index: true,
    },
    location: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    phone: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    avatar: { type: String, default: '', trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    licenseNumber: { type: String, default: '', trim: true },
    experience: { type: Number, default: 0 },
    degreeUrl: { type: String, default: '', trim: true },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    weeklySchedule: {
      monday: WeeklyDaySlotSchema,
      tuesday: WeeklyDaySlotSchema,
      wednesday: WeeklyDaySlotSchema,
      thursday: WeeklyDaySlotSchema,
      friday: WeeklyDaySlotSchema,
      saturday: WeeklyDaySlotSchema,
      sunday: WeeklyDaySlotSchema,
    },
    blockedDates: [{ type: String, trim: true }],
    isAway: { type: Boolean, default: false },
    dailyCapacity: { type: Number, default: 5, min: 1, max: 20 },
    languages: { type: String, default: '', trim: true },
    speciesWorked: [{ type: String, trim: true }],
    practiceName: { type: String, default: '', trim: true },
    practiceAddress: { type: String, default: '', trim: true },
    mapLink: { type: String, default: '', trim: true },
    consultationFee: { type: Number, default: null },
    homeVisit: { type: Boolean, default: false },
    homeVisitFee: { type: Number, default: null },
    paymentMethods: [{ type: String, trim: true }],
    education: { type: String, default: '', trim: true },
    certifications: { type: String, default: '', trim: true },
    services: [ProfessionalServiceSchema],
  },
  { timestamps: true },
)

module.exports = mongoose.model('Professional', ProfessionalSchema)
