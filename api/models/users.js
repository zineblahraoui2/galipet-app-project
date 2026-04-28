const mongoose = require('mongoose')
const { Schema } = mongoose

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  firstName: { type: String, trim: true, default: '' },
  lastName: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  avatar: { type: String, trim: true, default: '' },
  role: {
    type: String,
    enum: ['owner', 'professional', 'admin'],
    default: 'owner',
  },
  suspended: { type: Boolean, default: false },
  plan: {
    type: String,
    enum: ['free', 'pro', 'premium'],
    default: 'free',
  },
  subscription: {
    stripeCustomerId: { type: String, default: '' },
    stripeSubscriptionId: { type: String, default: '' },
    status: { type: String, default: '' },
  },
  proNotifications: {
    newBooking: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    reviews: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true },
  },
}, { timestamps: true })

module.exports = mongoose.model('User', UserSchema)
