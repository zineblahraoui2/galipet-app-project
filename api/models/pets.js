const mongoose = require('mongoose')
const { Schema } = mongoose

function vaccineStatusFromNextDate(nextDate) {
  if (!nextDate) return 'ok'
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const next = new Date(nextDate)
  const nextDay = new Date(next.getFullYear(), next.getMonth(), next.getDate())
  if (nextDay < today) return 'expired'
  const threshold = new Date(today)
  threshold.setDate(threshold.getDate() + 30)
  if (nextDay <= threshold) return 'due'
  return 'ok'
}

const VaccineSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    givenDate: { type: Date },
    nextDate: { type: Date },
    status: {
      type: String,
      enum: ['ok', 'due', 'expired'],
      default: 'ok',
    },
  },
  { _id: true },
)

const DocumentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    fileType: { type: String, default: '', trim: true },
    fileSize: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true },
)

const VetHistorySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    proName: { type: String, default: '', trim: true },
    date: { type: Date, required: true },
    notes: { type: String, default: '', trim: true },
    source: {
      type: String,
      enum: ['manual', 'booking'],
      default: 'manual',
    },
  },
  { _id: true },
)

const PetSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    species: { type: String, enum: ['dog', 'cat'], required: true },
    breed: { type: String, default: '', trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female'] },
    weight: { type: Number },
    color: { type: String, default: '', trim: true },
    microchip: { type: String, default: '', trim: true },
    neutered: { type: Boolean, default: false },
    usualVet: { type: String, default: '', trim: true },
    allergies: { type: String, default: '', trim: true },
    photo: { type: String, default: '', trim: true },
    vaccines: { type: [VaccineSchema], default: [] },
    documents: { type: [DocumentSchema], default: [] },
    vetHistory: { type: [VetHistorySchema], default: [] },
  },
  { timestamps: true },
)

PetSchema.pre('save', function petPreSave() {
  if (Array.isArray(this.vaccines)) {
    this.vaccines.forEach((vaccine) => {
      vaccine.status = vaccineStatusFromNextDate(vaccine.nextDate)
    })
  }
})

PetSchema.statics.computeVaccineStatus = vaccineStatusFromNextDate

module.exports = mongoose.model('Pet', PetSchema)
