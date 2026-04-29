const fs = require('fs')
const path = require('path')
const express = require('express')
const bcrypt = require('bcrypt')
const multer = require('multer')
const User = require('../models/users')
const Professional = require('../models/professionals')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars')
fs.mkdirSync(avatarsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    cb(null, `${req.user.id}-${Date.now()}${ext || '.jpg'}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) return cb(null, true)
    return cb(new Error('Only image files are allowed'))
  },
})

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id,
    name: userDoc.name ?? '',
    email: userDoc.email,
    firstName: userDoc.firstName ?? '',
    lastName: userDoc.lastName ?? '',
    phone: userDoc.phone ?? '',
    country: userDoc.country ?? '',
    city: userDoc.city ?? '',
    address: userDoc.address ?? '',
    avatar: userDoc.avatar ?? '',
    role: userDoc.role ?? 'owner',
    suspended: Boolean(userDoc.suspended),
    hasGoogleLogin: Boolean(userDoc.googleId),
    plan: userDoc.plan ?? 'free',
    subscription: userDoc.subscription || {
      stripeCustomerId: '',
      stripeSubscriptionId: '',
      status: '',
    },
    createdAt: userDoc.createdAt,
    proNotifications: userDoc.proNotifications || {
      newBooking: true,
      messages: true,
      reviews: true,
      reminders: true,
    },
  }
}

router.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id).select('-password')
    if (!userDoc) {
      return res.status(404).json({ error: 'user not found' })
    }
    return res.json({ ok: true, user: sanitizeUser(userDoc) })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load user' })
  }
})

router.patch('/api/users/me', authMiddleware, async (req, res) => {
  const body = req.body || {}
  try {
    const userBefore = await User.findById(req.user.id).select('-password')
    if (!userBefore) {
      return res.status(404).json({ error: 'user not found' })
    }
    const updates = {}
    if (Object.prototype.hasOwnProperty.call(body, 'firstName')) {
      updates.firstName = String(body.firstName ?? '').trim()
    }
    if (Object.prototype.hasOwnProperty.call(body, 'lastName')) {
      updates.lastName = String(body.lastName ?? '').trim()
    }
    if (Object.prototype.hasOwnProperty.call(body, 'phone')) {
      updates.phone = String(body.phone ?? '').trim()
    }
    if (Object.prototype.hasOwnProperty.call(body, 'country')) {
      updates.country = String(body.country ?? '').trim()
    }
    if (Object.prototype.hasOwnProperty.call(body, 'city')) {
      updates.city = String(body.city ?? '').trim()
    }
    if (Object.prototype.hasOwnProperty.call(body, 'address')) {
      updates.address = String(body.address ?? '').trim()
    }
    if (Object.prototype.hasOwnProperty.call(body, 'email') && String(body.email || '').trim()) {
      const email = String(body.email).trim().toLowerCase()
      const taken = await User.findOne({ email, _id: { $ne: req.user.id } }).select('_id').lean()
      if (taken) {
        return res.status(400).json({ error: 'email already in use' })
      }
      updates.email = email
    }
    if (body.proNotifications && typeof body.proNotifications === 'object') {
      const n = body.proNotifications
      updates.proNotifications = {
        newBooking: Boolean(n.newBooking),
        messages: Boolean(n.messages),
        reviews: Boolean(n.reviews),
        reminders: Boolean(n.reminders),
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'nothing to update' })
    }
    const nextFirst = updates.firstName !== undefined ? updates.firstName : userBefore.firstName || ''
    const nextLast = updates.lastName !== undefined ? updates.lastName : userBefore.lastName || ''
    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      updates.name = `${nextFirst} ${nextLast}`.trim()
    }
    const userDoc = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
      select: '-password',
    })
    if (!userDoc) {
      return res.status(404).json({ error: 'user not found' })
    }
    return res.json({ ok: true, user: sanitizeUser(userDoc) })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to update user' })
  }
})

router.patch('/api/users/me/password', authMiddleware, async (req, res) => {
  const currentPassword = String(req.body?.currentPassword || '')
  const newPassword = String(req.body?.newPassword || '')
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'new password must be at least 8 characters' })
  }
  try {
    const userDoc = await User.findById(req.user.id).select('password googleId')
    if (!userDoc) return res.status(404).json({ error: 'user not found' })
    if (!userDoc.password) {
      return res.status(400).json({
        error: 'This account uses Google sign-in. Change your password in your Google Account settings.',
      })
    }
    const ok = await bcrypt.compare(currentPassword, userDoc.password)
    if (!ok) return res.status(400).json({ error: 'current password is incorrect' })
    userDoc.password = await bcrypt.hash(newPassword, 10)
    await userDoc.save()
    return res.json({ ok: true })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to update password' })
  }
})

router.post(
  '/api/users/me/avatar',
  authMiddleware,
  upload.single('avatar'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'avatar file is required' })
    }
    const avatarPath = `/uploads/avatars/${req.file.filename}`
    try {
      const userDoc = await User.findByIdAndUpdate(
        req.user.id,
        { avatar: avatarPath },
        { new: true, runValidators: true, select: '-password' },
      )
      if (!userDoc) {
        return res.status(404).json({ error: 'user not found' })
      }
      return res.json({ ok: true, user: sanitizeUser(userDoc) })
    } catch (err) {
      return res
        .status(400)
        .json({ error: err.message || 'failed to upload avatar' })
    }
  },
)

router.delete('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const existing = await User.findById(req.user.id).select('role').lean()
    if (!existing) {
      return res.status(404).json({ error: 'user not found' })
    }
    if (String(existing.role) === 'professional') {
      await Professional.deleteMany({ userId: req.user.id })
    }
    const deleted = await User.findByIdAndDelete(req.user.id)
    if (!deleted) {
      return res.status(404).json({ error: 'user not found' })
    }
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to delete user' })
  }
})

module.exports = router
