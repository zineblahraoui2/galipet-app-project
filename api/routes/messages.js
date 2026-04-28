const express = require('express')
const mongoose = require('mongoose')
const authMiddleware = require('../middleware/authMiddleware')
const User = require('../models/users')
const Professional = require('../models/professionals')
const Booking = require('../models/bookings')
const Pet = require('../models/pets')
const Message = require('../models/Message')
const { sendMail } = require('../helpers/mailer')
const templates = require('../helpers/emailTemplates')

const router = express.Router()

router.use('/api/messages', authMiddleware)

function asOid(id) {
  const s = String(id || '').trim()
  if (!mongoose.Types.ObjectId.isValid(s)) return null
  return new mongoose.Types.ObjectId(s)
}

function displayName(u) {
  if (!u) return 'User'
  const n = String(u.name || '').trim()
  if (n) return n
  const a = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
  return a || 'User'
}

/**
 * Resolve owner / professional ids. Roles always come from the DB — JWT only has `req.user.id`.
 * Returns full `me` / `other` lean docs for thread payloads (otherUserPayload, etc.).
 */
async function resolveConversationPair(req, otherUserId) {
  try {
    const meOid = asOid(req.user.id)
    const otOid = asOid(otherUserId)
    if (!meOid || !otOid) {
      return { ok: false, status: 400, error: 'invalid user id' }
    }
    if (String(meOid) === String(otOid)) {
      return { ok: false, status: 400, error: 'Cannot message yourself' }
    }

    const [me, other] = await Promise.all([
      User.findById(meOid).select('role name firstName lastName email avatar').lean(),
      User.findById(otOid).select('role name firstName lastName email avatar').lean(),
    ])

    if (!me) return { ok: false, status: 401, error: 'Auth error' }
    if (!other) return { ok: false, status: 400, error: 'User not found' }

    const meRole = String(me.role || '').trim().toLowerCase()
    const otherRole = String(other.role || '').trim().toLowerCase()

    let ownerId
    let professionalId
    let meRoleOut

    if (meRole === 'owner' && otherRole === 'professional') {
      ownerId = me._id
      professionalId = other._id
      meRoleOut = 'owner'
    } else if (meRole === 'professional' && otherRole === 'owner') {
      ownerId = other._id
      professionalId = me._id
      meRoleOut = 'professional'
    } else {
      return {
        ok: false,
        status: 400,
        error: `Invalid conversation pair — roles do not match (${meRole} + ${otherRole})`,
      }
    }

    return {
      ok: true,
      ownerId,
      professionalId,
      me,
      other,
      meRole: meRoleOut,
    }
  } catch (err) {
    console.error('resolveConversationPair error:', err)
    return { ok: false, status: 500, error: 'Server error' }
  }
}

function conversationIdFromPair(ownerId, professionalId) {
  return `${String(ownerId)}_${String(professionalId)}`
}

function shapeMessageDoc(m) {
  return {
    _id: m._id,
    ownerId: m.ownerId,
    professionalId: m.professionalId,
    bookingId: m.bookingId || null,
    senderId: m.senderId,
    text: m.text,
    readAt: m.readAt || null,
    isSystem: Boolean(m.isSystem),
    systemType: m.systemType || null,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }
}

function shapeBookingContextFull(booking) {
  if (!booking) return null
  return {
    _id: booking._id,
    serviceName: booking.serviceName,
    startAt: booking.startAt,
    status: booking.status,
    duration: booking.duration ?? null,
    petName:
      booking.pet && typeof booking.pet === 'object' ? booking.pet.name : undefined,
    lateReportedBy: booking.lateReportedBy,
    lateMinutes: booking.lateMinutes,
    noShowReportedBy: booking.noShowReportedBy,
    rescheduleHistory: Array.isArray(booking.rescheduleHistory) ? booking.rescheduleHistory : [],
    cancelledBy: booking.cancelledBy,
    cancelReason: booking.cancelReason,
  }
}

function shapeBookingContextList(booking) {
  if (!booking) return null
  return {
    _id: booking._id,
    serviceName: booking.serviceName,
    startAt: booking.startAt,
    status: booking.status,
    petName:
      booking.pet && typeof booking.pet === 'object' ? booking.pet.name : undefined,
  }
}

function shapeThreadBookingOption(booking) {
  if (!booking) return null
  return {
    _id: booking._id,
    serviceName: booking.serviceName,
    startAt: booking.startAt,
    status: booking.status,
    duration: booking.duration ?? null,
    petName:
      booking.pet && typeof booking.pet === 'object' ? booking.pet.name : undefined,
  }
}

async function loadThreadBookings(ownerId, professionalId, limit = 25) {
  const rows = await Booking.find({ owner: ownerId, 'professional.userId': professionalId })
    .sort({ startAt: -1 })
    .limit(limit)
    .populate('pet', 'name species')
    .lean()
  return rows.map(shapeThreadBookingOption).filter(Boolean)
}

/** Valid booking id for this owner–professional pair, or null */
async function bookingIdForPair(bookingId, ownerId, professionalId) {
  const oid = asOid(bookingId)
  if (!oid) return null
  const b = await Booking.findOne({
    _id: oid,
    owner: ownerId,
    'professional.userId': professionalId,
  })
    .select('_id')
    .lean()
  return b ? b._id : null
}

/**
 * Pick which booking anchors the thread UI: explicit query → latest message with bookingId → latest by startAt.
 */
async function resolveFocusBookingId(ownerId, professionalId, requestedBookingId) {
  const explicit = await bookingIdForPair(requestedBookingId, ownerId, professionalId)
  if (explicit) return explicit
  const lastTagged = await Message.findOne({
    ownerId,
    professionalId,
    bookingId: { $exists: true, $ne: null },
  })
    .sort({ createdAt: -1 })
    .select('bookingId')
    .lean()
  if (lastTagged?.bookingId) {
    const v = await bookingIdForPair(lastTagged.bookingId, ownerId, professionalId)
    if (v) return v
  }
  const latest = await Booking.findOne({ owner: ownerId, 'professional.userId': professionalId })
    .sort({ startAt: -1 })
    .select('_id')
    .lean()
  return latest?._id || null
}

async function bookingContextForConversationRow(ownerId, professionalId, latestMsg) {
  let b = null
  if (latestMsg?.bookingId) {
    const id = await bookingIdForPair(latestMsg.bookingId, ownerId, professionalId)
    if (id) {
      b = await Booking.findById(id)
        .select('serviceName startAt status duration pet')
        .populate('pet', 'name')
        .lean()
    }
  }
  if (!b) {
    b = await Booking.findOne({ owner: ownerId, 'professional.userId': professionalId })
      .sort({ startAt: -1 })
      .select('serviceName startAt status duration pet')
      .populate('pet', 'name')
      .lean()
  }
  return shapeBookingContextList(b)
}

async function otherUserPayload(userDoc) {
  if (!userDoc) return null
  const base = {
    _id: userDoc._id,
    name: displayName(userDoc),
    email: userDoc.email || '',
    avatar: userDoc.avatar || '',
    role: userDoc.role || 'owner',
  }
  if (String(userDoc.role) === 'professional') {
    const pro = await Professional.findOne({ userId: userDoc._id }).select('specialty').lean()
    if (pro?.specialty) base.specialty = pro.specialty
  }
  return base
}

async function markThreadRead(ownerId, professionalId, readerUserId) {
  const rid = asOid(readerUserId)
  await Message.updateMany(
    {
      ownerId,
      professionalId,
      senderId: { $ne: rid },
      $or: [{ readAt: null }, { readAt: { $exists: false } }],
    },
    { $set: { readAt: new Date() } },
  )
}

let lastReminderRun = 0

function combineBookingDateTime(b) {
  const d = new Date(b.startAt)
  if (Number.isNaN(d.getTime())) return null
  return d
}

async function ensureRemindersSent() {
  const now = Date.now()
  if (now - lastReminderRun < 5 * 60 * 1000) return
  lastReminderRun = now
  try {
    const rows = await Booking.find({ status: { $in: ['confirmed', 'late', 'rescheduled'] } }).lean()
    for (const b of rows) {
      const start = combineBookingDateTime(b)
      if (!start) continue
      const msUntil = start.getTime() - now
      if (msUntil < 23 * 60 * 60 * 1000 || msUntil > 25 * 60 * 60 * 1000) continue
      const ou = b.owner
      const pu = b.professional?.userId
      if (!ou || !pu) continue
      const dup = await Message.findOne({ bookingId: b._id, systemType: 'reminder_24h' }).lean()
      if (dup) continue
      await Message.create({
        ownerId: ou,
        professionalId: pu,
        bookingId: b._id,
        senderId: pu,
        text: 'Reminder: your appointment is in about 24 hours 🐾',
        isSystem: true,
        systemType: 'reminder_24h',
      })
    }
  } catch (err) {
    console.error('[messages] reminder scan', err.message)
  }
}

router.get('/api/messages/unread-count', async (req, res) => {
  try {
    await ensureRemindersSent()
    const uid = asOid(req.user.id)
    const count = await Message.countDocuments({
      $and: [
        { $or: [{ ownerId: uid }, { professionalId: uid }] },
        { senderId: { $ne: uid } },
        { $or: [{ readAt: null }, { readAt: { $exists: false } }] },
      ],
    })
    return res.json({ ok: true, count })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed' })
  }
})

router.get('/api/messages/conversations', async (req, res) => {
  try {
    await ensureRemindersSent()
    const uid = asOid(req.user.id)
    const pipeline = [
      { $match: { $or: [{ ownerId: uid }, { professionalId: uid }] } },
      {
        $addFields: {
          pairKey: {
            $concat: [{ $toString: '$ownerId' }, '_', { $toString: '$professionalId' }],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$pairKey',
          ownerId: { $first: '$ownerId' },
          professionalId: { $first: '$professionalId' },
          latest: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $ifNull: ['$readAt', null] }, null] },
                    { $ne: ['$senderId', uid] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { 'latest.createdAt': -1 } },
    ]
    const groups = await Message.aggregate(pipeline)
    const out = []
    for (const g of groups) {
      const ownerId = g.ownerId
      const professionalId = g.professionalId
      const lm = g.latest
      const otherOid = String(ownerId) === String(uid) ? professionalId : ownerId
      const [otherUser, booking, pet] = await Promise.all([
        User.findById(otherOid).select('name firstName lastName email avatar role').lean(),
        bookingContextForConversationRow(ownerId, professionalId, lm),
        Pet.findOne({ owner: ownerId }).sort({ updatedAt: -1 }).select('name species breed dateOfBirth').lean(),
      ])
      out.push({
        conversationId: conversationIdFromPair(ownerId, professionalId),
        otherUser: await otherUserPayload(otherUser),
        latestMessage: {
          text: lm.text,
          createdAt: lm.createdAt,
          senderId: lm.senderId,
          isSystem: Boolean(lm.isSystem),
          systemType: lm.systemType || null,
        },
        unreadCount: g.unreadCount || 0,
        bookingContext: booking,
        petInfo: pet
          ? {
              name: pet.name,
              species: pet.species,
              breed: pet.breed || '',
            }
          : null,
      })
    }
    return res.json({ ok: true, conversations: out })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load conversations' })
  }
})

router.get('/api/messages/conversation/:userId', async (req, res) => {
  try {
    console.log('CONV REQUEST:', req.params.userId, 'by user:', req.user.id)
    const pair = await resolveConversationPair(req, req.params.userId)
    if (!pair.ok) return res.status(pair.status).json({ error: pair.error })
    const { ownerId, professionalId } = pair
    const after = String(req.query.after || '').trim()
    const requestedBooking = String(req.query.bookingId || '').trim()
    const filter = { ownerId, professionalId }
    if (after && mongoose.Types.ObjectId.isValid(after)) {
      filter._id = { $gt: new mongoose.Types.ObjectId(after) }
    }
    const list = await Message.find(filter).sort({ createdAt: 1 }).limit(after ? 200 : 500).lean()
    await markThreadRead(ownerId, professionalId, req.user.id)

    const isIncrementalPoll = Boolean(after && mongoose.Types.ObjectId.isValid(after))

    const focusBookingId = await resolveFocusBookingId(
      ownerId,
      professionalId,
      requestedBooking || null,
    )

    const [threadBookings, focusBooking, fallbackPet, otherPayload] = await Promise.all([
      isIncrementalPoll ? Promise.resolve(null) : loadThreadBookings(ownerId, professionalId),
      focusBookingId
        ? Booking.findById(focusBookingId).populate('pet', 'name species').lean()
        : Promise.resolve(null),
      Pet.findOne({ owner: ownerId }).sort({ updatedAt: -1 }).select('name species breed dateOfBirth').lean(),
      otherUserPayload(pair.other),
    ])

    const bookingContext = shapeBookingContextFull(focusBooking)

    let pet = null
    if (focusBooking?.pet) {
      const petRef = focusBooking.pet
      const petId = typeof petRef === 'object' && petRef?._id ? petRef._id : petRef
      if (petId) {
        pet = await Pet.findById(petId).select('name species breed dateOfBirth').lean()
      }
    }
    if (!pet) pet = fallbackPet

    let petInfo = null
    if (pet) {
      let age = null
      if (pet.dateOfBirth) {
        const dob = new Date(pet.dateOfBirth)
        if (!Number.isNaN(dob.getTime())) {
          const diff = Date.now() - dob.getTime()
          age = Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)))
        }
      }
      petInfo = {
        name: pet.name,
        species: pet.species,
        breed: pet.breed || '',
        age,
      }
    }

    const payload = {
      ok: true,
      messages: list.map(shapeMessageDoc),
      otherUser: otherPayload,
      bookingContext,
      focusBookingId: focusBookingId ? String(focusBookingId) : null,
      petInfo,
    }
    if (!isIncrementalPoll) {
      payload.threadBookings = Array.isArray(threadBookings) ? threadBookings : []
    }
    return res.json(payload)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load thread' })
  }
})

router.put('/api/messages/read/:userId', async (req, res) => {
  try {
    const pair = await resolveConversationPair(req, req.params.userId)
    if (!pair.ok) return res.status(pair.status).json({ error: pair.error })
    await markThreadRead(pair.ownerId, pair.professionalId, req.user.id)
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed' })
  }
})

router.post('/api/messages/send', async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim()
    if (!text) return res.status(400).json({ error: 'text is required' })
    if (text.length > 2000) return res.status(400).json({ error: 'text too long' })
    const recipientId = String(req.body?.recipientId || '').trim()
    const bookingIdRaw = req.body?.bookingId
    const pair = await resolveConversationPair(req, recipientId)
    if (!pair.ok) {
      return res.status(pair.status).json({ error: pair.error || 'invalid recipient' })
    }
    const { ownerId, professionalId } = pair
    let bookingId = null
    if (bookingIdRaw && mongoose.Types.ObjectId.isValid(String(bookingIdRaw))) {
      const candidate = new mongoose.Types.ObjectId(String(bookingIdRaw))
      const b = await Booking.findById(candidate).select('owner professional.userId').lean()
      if (
        b
        && String(b.owner) === String(ownerId)
        && String(b.professional?.userId || '') === String(professionalId)
      ) {
        bookingId = candidate
      }
    }
    const doc = await Message.create({
      ownerId,
      professionalId,
      bookingId,
      senderId: req.user.id,
      text,
      isSystem: false,
    })
    const lean = await Message.findById(doc._id).lean()

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentMessage = await Message.findOne({
      senderId: req.user.id,
      ownerId,
      professionalId,
      createdAt: { $gt: fiveMinutesAgo },
      _id: { $ne: doc._id },
      isSystem: { $ne: true },
    })
      .select('_id')
      .lean()

    if (!recentMessage && pair.other?.email) {
      const preview = text.slice(0, 100) + (text.length > 100 ? '...' : '')
      sendMail({
        to: pair.other.email,
        subject: `Nouveau message de ${displayName(pair.me)}`,
        html: templates.newMessageNotification({
          recipientName: displayName(pair.other),
          senderName: displayName(pair.me),
          messagePreview: preview,
          role: pair.other.role,
        }),
      })
    }

    return res.status(201).json(shapeMessageDoc(lean))
  } catch (err) {
    return res.status(400).json({ error: err.message || 'send failed' })
  }
})

module.exports = router
