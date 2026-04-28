const express = require('express')
const mongoose = require('mongoose')
const authMiddleware = require('../middleware/authMiddleware')
const adminMiddleware = require('../middleware/adminMiddleware')
const User = require('../models/users')
const Professional = require('../models/professionals')
const Booking = require('../models/bookings')
const Pet = require('../models/pets')
const Message = require('../models/Message')
const Review = require('../models/Review')
const Activity = require('../models/activity')

const router = express.Router()

router.use('/api/admin', authMiddleware, adminMiddleware)

function ensureAdminRole(req, res) {
  if (String(req?.user?.role || '').toLowerCase() !== 'admin') {
    res.status(403).json({ message: 'Admin only' })
    return false
  }
  return true
}

function asObjectId(id) {
  const s = String(id || '').trim()
  if (!mongoose.Types.ObjectId.isValid(s)) return null
  return new mongoose.Types.ObjectId(s)
}

router.get('/api/admin/stats', async (_req, res) => {
  try {
    const now = new Date()
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [users, professionals, bookingsToday, monthRows, pendingProfessionals, failedPayments] = await Promise.all([
      User.countDocuments({}),
      Professional.countDocuments({}),
      Booking.countDocuments({ startAt: { $gte: startDay, $lt: endDay } }),
      Booking.find({
        status: { $in: ['confirmed', 'completed', 'rescheduled', 'late'] },
        startAt: { $gte: startMonth, $lt: endMonth },
      })
        .select('price')
        .lean(),
      Professional.countDocuments({ verificationStatus: 'pending' }),
      User.countDocuments({ 'subscription.status': { $in: ['past_due', 'unpaid'] } }),
    ])

    const revenueMonth = monthRows.reduce((sum, row) => sum + (Number(row.price) || 0), 0)

    return res.json({
      ok: true,
      users,
      professionals,
      bookingsToday,
      revenueMonth,
      pendingProfessionals,
      failedPayments,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'failed to load stats' })
  }
})

router.get('/api/admin/stats/bookings-by-month', async (req, res) => {
  if (!ensureAdminRole(req, res)) return
  try {
    const yearRaw = Number(req.query?.year)
    const year = Number.isFinite(yearRaw) && yearRaw > 1970 ? Math.round(yearRaw) : null
    const bookings = await Booking.find({})
      .select('startAt date price')
      .lean()

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const grouped = Array(12)
      .fill(null)
      .map((_, i) => ({
        month: months[i],
        bookings: 0,
        revenue: 0,
      }))

    bookings.forEach((b) => {
      const rawDate = b?.startAt || b?.date || null
      const d = rawDate ? new Date(rawDate) : null
      if (!d || Number.isNaN(d.getTime())) return
      if (year != null && d.getFullYear() !== year) return
      const month = d.getMonth()
      grouped[month].bookings += 1
      grouped[month].revenue += Number(b?.price) || 0
    })

    return res.json({ data: grouped })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'failed to load bookings by month' })
  }
})

router.get('/api/admin/stats/users-by-role', async (req, res) => {
  if (!ensureAdminRole(req, res)) return
  try {
    const [users, professionals] = await Promise.all([
      User.find({}).select('role').lean(),
      Professional.find({}).select('specialty').lean(),
    ])

    const vets = professionals.filter((p) => p.specialty === 'vet').length
    const groomers = professionals.filter((p) => p.specialty === 'grooming').length
    const sitters = professionals.filter((p) => p.specialty === 'sitting').length
    const trainers = professionals.filter((p) => p.specialty === 'training').length
    const owners = users.filter((u) => u.role === 'owner').length

    return res.json({
      data: [
        { role: 'Owners', count: owners },
        { role: 'Vets', count: vets },
        { role: 'Groomers', count: groomers },
        { role: 'Sitters', count: sitters },
        { role: 'Trainers', count: trainers },
      ],
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'failed to load users by role' })
  }
})

router.get('/api/admin/users', async (req, res) => {
  try {
    const role = String(req.query?.role || '').trim().toLowerCase()
    const filter = role ? { role } : {}
    const users = await User.find(filter)
      .select('name email role plan suspended createdAt subscription.status')
      .sort({ createdAt: -1 })
      .lean()
    return res.json({ ok: true, users })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'failed to load users' })
  }
})

router.patch('/api/admin/users/:id/suspend', async (req, res) => {
  try {
    const id = asObjectId(req.params.id)
    if (!id) return res.status(400).json({ message: 'invalid user id' })
    const suspended = Boolean(req.body?.suspended ?? true)
    const userDoc = await User.findByIdAndUpdate(
      id,
      { $set: { suspended } },
      { new: true, runValidators: true, select: 'name email role plan suspended createdAt subscription.status' },
    ).lean()
    if (!userDoc) return res.status(404).json({ message: 'user not found' })
    return res.json({ ok: true, user: userDoc })
  } catch (err) {
    return res.status(400).json({ message: err.message || 'failed to suspend user' })
  }
})

router.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const id = asObjectId(req.params.id)
    if (!id) return res.status(400).json({ message: 'invalid user id' })
    if (String(id) === String(req.user.id)) {
      return res.status(403).json({ message: 'cannot delete your own account' })
    }
    const target = await User.findById(id).select('role').lean()
    if (!target) return res.status(404).json({ message: 'user not found' })
    if (String(target.role || '').toLowerCase() === 'admin') {
      return res.status(403).json({ message: 'cannot delete admin accounts' })
    }

    await Review.deleteMany({ $or: [{ ownerId: id }, { professionalId: id }] })
    await Booking.deleteMany({ $or: [{ owner: id }, { 'professional.userId': id }] })
    await Message.deleteMany({ $or: [{ ownerId: id }, { professionalId: id }, { senderId: id }] })
    await Pet.deleteMany({ owner: id })
    await Activity.deleteMany({ owner: id })
    await Professional.deleteMany({ userId: id })
    const deleted = await User.findByIdAndDelete(id)
    if (!deleted) return res.status(404).json({ message: 'user not found' })
    return res.json({ ok: true })
  } catch (err) {
    return res.status(400).json({ message: err.message || 'failed to delete user' })
  }
})

router.get('/api/admin/professionals', async (_req, res) => {
  try {
    const professionals = await Professional.find({})
      .select('name specialty city verificationStatus isVerified userId rating')
      .sort({ createdAt: -1 })
      .lean()
    return res.json({ ok: true, professionals })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'failed to load professionals' })
  }
})

router.patch('/api/admin/professionals/:id/approve', async (req, res) => {
  try {
    const id = asObjectId(req.params.id)
    if (!id) return res.status(400).json({ message: 'invalid professional id' })
    const professional = await Professional.findByIdAndUpdate(
      id,
      { $set: { verificationStatus: 'verified', isVerified: true } },
      { new: true, runValidators: true, select: 'name specialty city verificationStatus isVerified userId' },
    ).lean()
    if (!professional) return res.status(404).json({ message: 'professional not found' })
    return res.json({ ok: true, professional })
  } catch (err) {
    return res.status(400).json({ message: err.message || 'failed to approve professional' })
  }
})

router.patch('/api/admin/professionals/:id/reject', async (req, res) => {
  try {
    const id = asObjectId(req.params.id)
    if (!id) return res.status(400).json({ message: 'invalid professional id' })
    const professional = await Professional.findByIdAndUpdate(
      id,
      { $set: { verificationStatus: 'rejected', isVerified: false } },
      { new: true, runValidators: true, select: 'name specialty city verificationStatus isVerified userId' },
    ).lean()
    if (!professional) return res.status(404).json({ message: 'professional not found' })
    return res.json({ ok: true, professional })
  } catch (err) {
    return res.status(400).json({ message: err.message || 'failed to reject professional' })
  }
})

router.get('/api/admin/bookings', async (req, res) => {
  try {
    const status = String(req.query?.status || '').trim().toLowerCase()
    const limitRaw = Number(req.query?.limit)
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, Math.round(limitRaw)) : 100
    const filter = status ? { status } : {}
    const bookings = await Booking.find(filter)
      .select('owner professional serviceName startAt status price')
      .populate('owner', 'name firstName lastName email')
      .sort({ startAt: -1 })
      .limit(limit)
      .lean()
    return res.json({ ok: true, bookings })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'failed to load bookings' })
  }
})

router.patch('/api/admin/bookings/:id/cancel', async (req, res) => {
  try {
    const id = asObjectId(req.params.id)
    if (!id) return res.status(400).json({ message: 'invalid booking id' })
    const booking = await Booking.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'cancelled',
          cancelledBy: 'professional',
          cancelReason: 'Cancelled by admin',
        },
      },
      { new: true, runValidators: true },
    )
      .populate('owner', 'name firstName lastName email')
      .lean()
    if (!booking) return res.status(404).json({ message: 'booking not found' })
    return res.json({ ok: true, booking })
  } catch (err) {
    return res.status(400).json({ message: err.message || 'failed to cancel booking' })
  }
})

router.get('/api/admin/payments', async (_req, res) => {
  try {
    const payments = await User.find({ role: { $in: ['owner', 'professional'] } })
      .select('name email plan subscription')
      .sort({ updatedAt: -1 })
      .lean()
    return res.json({
      ok: true,
      payments: payments.map((u) => ({
        _id: u._id,
        name: u.name || '',
        email: u.email || '',
        plan: u.plan || 'free',
        status: String(u.subscription?.status || (u.plan === 'free' ? 'inactive' : 'active')),
        stripeCustomerId: u.subscription?.stripeCustomerId || '',
        stripeSubscriptionId: u.subscription?.stripeSubscriptionId || '',
      })),
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'failed to load payments' })
  }
})

module.exports = router
