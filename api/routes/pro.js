const fs = require('fs')
const path = require('path')
const express = require('express')
const multer = require('multer')
const authMiddleware = require('../middleware/authMiddleware')
const User = require('../models/users')
const Professional = require('../models/professionals')
const Booking = require('../models/bookings')

const proAvatarsDir = path.join(__dirname, '..', 'uploads', 'pro-avatars')
const proDegreesDir = path.join(__dirname, '..', 'uploads', 'pro-degrees')
fs.mkdirSync(proAvatarsDir, { recursive: true })
fs.mkdirSync(proDegreesDir, { recursive: true })

const proAvatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, proAvatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    cb(null, `pro-${req.user.id}-${Date.now()}${ext || '.jpg'}`)
  },
})

const proDegreeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, proDegreesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    cb(null, `degree-${req.user.id}-${Date.now()}${ext || '.pdf'}`)
  },
})

const uploadProAvatar = multer({
  storage: proAvatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) return cb(null, true)
    return cb(new Error('Only image files are allowed'))
  },
})

const uploadProDegree = multer({
  storage: proDegreeStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const okMime = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype || '')
    const okName = /\.(pdf|jpe?g|png)$/i.test(file.originalname || '')
    if (okMime || okName) return cb(null, true)
    return cb(new Error('Only PDF, JPG or PNG files are allowed'))
  },
})

const router = express.Router()

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function slot(on, start, end, breakStart, breakEnd) {
  return {
    enabled: on,
    start,
    end,
    breakStart: breakStart || '',
    breakEnd: breakEnd || '',
  }
}

function defaultWeeklySchedule() {
  return {
    monday: slot(true, '09:00', '18:00', '13:00', '14:00'),
    tuesday: slot(true, '09:00', '18:00', '13:00', '14:00'),
    wednesday: slot(true, '09:00', '18:00', '13:00', '14:00'),
    thursday: slot(true, '09:00', '18:00', '13:00', '14:00'),
    friday: slot(true, '09:00', '17:00', '13:00', '14:00'),
    saturday: slot(false, '10:00', '14:00', '', ''),
    sunday: slot(false, '10:00', '14:00', '', ''),
  }
}

function mergeWeeklyFromStored(stored) {
  const base = defaultWeeklySchedule()
  if (!stored || typeof stored !== 'object') return base
  for (const k of DAY_KEYS) {
    if (stored[k] && typeof stored[k] === 'object') {
      base[k] = { ...base[k], ...stored[k], enabled: Boolean(stored[k].enabled) }
    }
  }
  return base
}

function normalizeSchedulePayload(pro) {
  return {
    weeklySchedule: mergeWeeklyFromStored(pro.weeklySchedule),
    blockedDates: Array.isArray(pro.blockedDates) ? pro.blockedDates.map(String) : [],
    isAway: Boolean(pro.isAway),
    dailyCapacity: Math.min(20, Math.max(1, Number(pro.dailyCapacity) || 5)),
  }
}

function shapeProProfileResponse(pro, userDoc) {
  const u = userDoc || {}
  return {
    professional: {
      _id: pro._id,
      name: pro.name || '',
      specialty: pro.specialty,
      location: pro.location || '',
      city: pro.city || '',
      phone: pro.phone || '',
      description: pro.description || '',
      avatar: pro.avatar || '',
      languages: pro.languages || '',
      speciesWorked: Array.isArray(pro.speciesWorked) ? pro.speciesWorked : [],
      practiceName: pro.practiceName || '',
      practiceAddress: pro.practiceAddress || '',
      mapLink: pro.mapLink || '',
      consultationFee: pro.consultationFee ?? null,
      homeVisit: Boolean(pro.homeVisit),
      homeVisitFee: pro.homeVisitFee ?? null,
      paymentMethods: Array.isArray(pro.paymentMethods) ? pro.paymentMethods : [],
      licenseNumber: pro.licenseNumber || '',
      experience: Number(pro.experience) || 0,
      education: pro.education || '',
      certifications: pro.certifications || '',
      degreeUrl: pro.degreeUrl || '',
      verificationStatus: pro.verificationStatus || 'pending',
      isVerified: Boolean(pro.isVerified),
      lat: pro.lat ?? null,
      lng: pro.lng ?? null,
      weeklySchedule: mergeWeeklyFromStored(pro.weeklySchedule),
    },
    user: {
      email: u.email || '',
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      hasGoogleLogin: Boolean(u.googleId),
      proNotifications: u.proNotifications || {
        newBooking: true,
        messages: true,
        reviews: true,
        reminders: true,
      },
    },
  }
}

function ownerDisplayName(owner) {
  if (!owner) return 'Pet owner'
  const n = String(owner.name || '').trim()
  if (n) return n
  const a = [owner.firstName, owner.lastName].filter(Boolean).join(' ').trim()
  return a || 'Pet owner'
}

function shapeProBooking(b, proMongoId) {
  const owner = b.owner && typeof b.owner === 'object' ? b.owner : {}
  return {
    _id: b._id,
    ownerUserId: owner._id ? String(owner._id) : null,
    user: { name: ownerDisplayName(owner), email: owner.email || '' },
    professional: { _id: proMongoId },
    serviceId: b.serviceId || null,
    serviceName: b.serviceName,
    duration: b.duration ?? null,
    startAt: b.startAt,
    status: b.status,
    createdAt: b.createdAt,
    notes: String(b.notes || '').trim(),
    pet: b.pet && typeof b.pet === 'object' ? { name: b.pet.name || 'Pet', species: b.pet.species } : null,
    cancelledBy: b.cancelledBy,
    cancelReason: b.cancelReason,
    lateReportedBy: b.lateReportedBy,
    lateMinutes: b.lateMinutes,
    noShowReportedBy: b.noShowReportedBy,
    rescheduleHistory: Array.isArray(b.rescheduleHistory) ? b.rescheduleHistory : [],
  }
}

function shapeServices(pro) {
  const list = Array.isArray(pro?.services) ? pro.services : []
  return list.map((s) => ({
    _id: s?._id,
    name: String(s?.name || '').trim(),
    price: Number(s?.price) || 0,
    duration: s?.duration == null ? null : Number(s.duration) || null,
    description: String(s?.description || '').trim(),
  }))
}

async function requireProfessional(req, res, next) {
  try {
    const userDoc = await User.findById(req.user.id).select('role').lean()
    if (!userDoc || userDoc.role !== 'professional') {
      return res.status(403).json({ error: 'professionals only' })
    }
    const pro = await Professional.findOne({ userId: req.user.id }).lean()
    if (!pro) {
      return res.status(404).json({ error: 'professional profile not found' })
    }
    req.proDoc = pro
    return next()
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed' })
  }
}

router.get('/api/pro/stats', authMiddleware, requireProfessional, async (req, res) => {
  try {
    const pro = req.proDoc
    const rows = await Booking.find({ 'professional.userId': req.user.id })
      .select('startAt status price')
      .lean()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    let todayCount = 0
    let pendingCount = 0
    let revenue = 0

    for (const b of rows) {
      if (String(b.status || '').toLowerCase() === 'pending') pendingCount += 1
      const d = b.startAt ? new Date(b.startAt) : null
      if (d && !Number.isNaN(d.getTime()) && d.toDateString() === now.toDateString()) {
        todayCount += 1
      }
      const bd = b.startAt ? new Date(b.startAt) : null
      if (
        bd &&
        !Number.isNaN(bd.getTime()) &&
        bd >= startOfMonth &&
        ['confirmed', 'completed'].includes(String(b.status)) &&
        typeof b.price === 'number' &&
        !Number.isNaN(b.price)
      ) {
        revenue += b.price
      }
    }

    return res.json({
      ok: true,
      todayCount,
      pendingCount,
      totalCount: rows.length,
      revenue,
      rating: Number(pro.rating || 0),
      reviewsCount: Number(pro.reviewsCount || 0),
      specialty: pro.specialty,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load stats' })
  }
})

router.get('/api/pro/bookings', authMiddleware, requireProfessional, async (req, res) => {
  try {
    const pro = req.proDoc
    const list = await Booking.find({ 'professional.userId': req.user.id })
      .populate('owner', 'name firstName lastName email')
      .populate('pet', 'name species')
      .sort({ startAt: -1 })
      .lean()

    const bookings = list.map((b) => shapeProBooking(b, pro._id))
    return res.json({ ok: true, bookings })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load bookings' })
  }
})

router.get('/api/pro/schedule', authMiddleware, requireProfessional, async (req, res) => {
  try {
    const fresh = await Professional.findById(req.proDoc._id).lean()
    return res.json({ ok: true, ...normalizeSchedulePayload(fresh) })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load schedule' })
  }
})

router.put('/api/pro/schedule', authMiddleware, requireProfessional, async (req, res) => {
  try {
    const body = req.body || {}
    const updates = {}

    if (body.weeklySchedule && typeof body.weeklySchedule === 'object') {
      const merged = mergeWeeklyFromStored(req.proDoc.weeklySchedule)
      for (const k of DAY_KEYS) {
        if (body.weeklySchedule[k] && typeof body.weeklySchedule[k] === 'object') {
          const inc = body.weeklySchedule[k]
          merged[k] = {
            ...merged[k],
            ...inc,
            enabled: Boolean(inc.enabled),
            start: String(inc.start || merged[k].start),
            end: String(inc.end || merged[k].end),
            breakStart: String(inc.breakStart ?? merged[k].breakStart ?? ''),
            breakEnd: String(inc.breakEnd ?? merged[k].breakEnd ?? ''),
          }
        }
      }
      updates.weeklySchedule = merged
    }
    if (Array.isArray(body.blockedDates)) {
      updates.blockedDates = body.blockedDates.map((d) => String(d).trim().slice(0, 10)).filter(Boolean)
    }
    if (typeof body.isAway === 'boolean') {
      updates.isAway = body.isAway
    }
    if (body.dailyCapacity != null && body.dailyCapacity !== '') {
      updates.dailyCapacity = Math.min(20, Math.max(1, Number.parseInt(String(body.dailyCapacity), 10) || 5))
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'nothing to update' })
    }

    await Professional.updateOne({ _id: req.proDoc._id }, { $set: updates })
    const fresh = await Professional.findById(req.proDoc._id).lean()
    return res.json({ ok: true, ...normalizeSchedulePayload(fresh) })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to save schedule' })
  }
})

router.put('/api/pro/away', authMiddleware, requireProfessional, async (req, res) => {
  try {
    const isAway = Boolean(req.body?.isAway)
    await Professional.updateOne({ _id: req.proDoc._id }, { $set: { isAway } })
    return res.json({ ok: true, isAway })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to update away mode' })
  }
})

router.get('/api/pro/services', authMiddleware, requireProfessional, async (req, res) => {
  try {
    const fresh = await Professional.findById(req.proDoc._id).select('services').lean()
    return res.json({ ok: true, services: shapeServices(fresh) })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load services' })
  }
})

router.post('/api/pro/services', authMiddleware, requireProfessional, async (req, res) => {
  try {
    const body = req.body || {}
    const name = String(body.name || '').trim()
    const price = Number(body.price)
    const duration =
      body.duration == null || body.duration === '' ? null : Number.parseInt(String(body.duration), 10)
    const description = String(body.description || '').trim()

    if (!name) {
      return res.status(400).json({ error: 'service name is required' })
    }
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: 'valid price is required' })
    }
    if (duration != null && (!Number.isFinite(duration) || duration <= 0)) {
      return res.status(400).json({ error: 'duration must be a positive number' })
    }

    await Professional.updateOne(
      { _id: req.proDoc._id },
      {
        $push: {
          services: {
            name,
            price,
            duration,
            description,
          },
        },
      },
    )

    const fresh = await Professional.findById(req.proDoc._id).select('services').lean()
    return res.status(201).json({ ok: true, services: shapeServices(fresh) })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to add service' })
  }
})

router.delete('/api/pro/services/:serviceId', authMiddleware, requireProfessional, async (req, res) => {
  try {
    const serviceId = String(req.params?.serviceId || '').trim()
    if (!serviceId) {
      return res.status(400).json({ error: 'service id is required' })
    }
    await Professional.updateOne({ _id: req.proDoc._id }, { $pull: { services: { _id: serviceId } } })
    return res.json({ ok: true })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to remove service' })
  }
})

router.get('/api/pro/profile', authMiddleware, requireProfessional, async (req, res) => {
  try {
    const freshPro = await Professional.findById(req.proDoc._id).lean()
    const userDoc = await User.findById(req.user.id).select('-password').lean()
    return res.json({ ok: true, ...shapeProProfileResponse(freshPro, userDoc) })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load profile' })
  }
})

router.patch('/api/pro/profile', authMiddleware, requireProfessional, async (req, res) => {
  try {
    const body = req.body || {}
    if (Array.isArray(body.description)) {
      body.description = body.description.join(', ')
    }
    const set = {}
    const stringFields = [
      'name',
      'location',
      'city',
      'phone',
      'description',
      'languages',
      'practiceName',
      'practiceAddress',
      'mapLink',
      'licenseNumber',
      'education',
      'certifications',
    ]
    for (const k of stringFields) {
      if (Object.prototype.hasOwnProperty.call(body, k)) {
        set[k] = String(body[k] ?? '').trim()
      }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'specialty')) {
      const s = String(body.specialty || '').toLowerCase()
      if (!['vet', 'grooming', 'sitting', 'training'].includes(s)) {
        return res.status(400).json({ error: 'invalid specialty' })
      }
      set.specialty = s
    }
    if (Object.prototype.hasOwnProperty.call(body, 'experience')) {
      const n = Number(body.experience)
      set.experience = Number.isFinite(n) ? Math.min(50, Math.max(0, Math.round(n))) : 0
    }
    if (Object.prototype.hasOwnProperty.call(body, 'consultationFee')) {
      if (body.consultationFee === '' || body.consultationFee === null) {
        set.consultationFee = null
      } else {
        const n = Number(body.consultationFee)
        set.consultationFee = Number.isFinite(n) ? n : null
      }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'homeVisitFee')) {
      if (body.homeVisitFee === '' || body.homeVisitFee === null) {
        set.homeVisitFee = null
      } else {
        const n = Number(body.homeVisitFee)
        set.homeVisitFee = Number.isFinite(n) ? n : null
      }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'homeVisit')) {
      set.homeVisit = Boolean(body.homeVisit)
    }
    if (Array.isArray(body.speciesWorked)) {
      set.speciesWorked = body.speciesWorked.map((x) => String(x).trim()).filter(Boolean)
    }
    if (Array.isArray(body.paymentMethods)) {
      set.paymentMethods = body.paymentMethods.map((x) => String(x).trim()).filter(Boolean)
    }
    if (Object.keys(set).length === 0) {
      return res.status(400).json({ error: 'nothing to update' })
    }
    await Professional.updateOne({ _id: req.proDoc._id }, { $set: set })
    const freshPro = await Professional.findById(req.proDoc._id).lean()
    const userDoc = await User.findById(req.user.id).select('-password').lean()
    return res.json({ ok: true, ...shapeProProfileResponse(freshPro, userDoc) })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to update profile' })
  }
})

router.post(
  '/api/pro/profile/avatar',
  authMiddleware,
  requireProfessional,
  (req, res, next) => {
    uploadProAvatar.single('avatar')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'invalid upload' })
      }
      return next()
    })
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'avatar file is required' })
    }
    try {
      const avatarPath = `/uploads/pro-avatars/${req.file.filename}`
      await Professional.updateOne({ _id: req.proDoc._id }, { $set: { avatar: avatarPath } })
      const freshPro = await Professional.findById(req.proDoc._id).lean()
      const userDoc = await User.findById(req.user.id).select('-password').lean()
      return res.json({ ok: true, ...shapeProProfileResponse(freshPro, userDoc) })
    } catch (err) {
      return res.status(400).json({ error: err.message || 'failed to upload avatar' })
    }
  },
)

router.post(
  '/api/pro/profile/degree',
  authMiddleware,
  requireProfessional,
  (req, res, next) => {
    uploadProDegree.single('degree')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'invalid upload' })
      }
      return next()
    })
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'degree file is required' })
    }
    try {
      const degreeUrl = `/uploads/pro-degrees/${req.file.filename}`
      const wasVerified = String(req.proDoc.verificationStatus) === 'verified'
      const updates = { degreeUrl }
      if (wasVerified) {
        updates.verificationStatus = 'pending'
      }
      await Professional.updateOne({ _id: req.proDoc._id }, { $set: updates })
      const freshPro = await Professional.findById(req.proDoc._id).lean()
      const userDoc = await User.findById(req.user.id).select('-password').lean()
      return res.json({ ok: true, ...shapeProProfileResponse(freshPro, userDoc) })
    } catch (err) {
      return res.status(400).json({ error: err.message || 'failed to upload degree' })
    }
  },
)

module.exports = router
