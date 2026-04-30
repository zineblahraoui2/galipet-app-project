const express = require('express')
const mongoose = require('mongoose')
const Booking = require('../models/bookings')
const Pet = require('../models/pets')
const User = require('../models/users')
const Professional = require('../models/professionals')
const authMiddleware = require('../middleware/authMiddleware')
const logActivity = require('../helpers/logActivity')
const Message = require('../models/Message')
const { appointmentStart } = require('../helpers/appointmentTime')
const { ensureReviewWindowForBooking } = require('../helpers/ensureReviewWindow')
const { sendMail } = require('../helpers/mailer')
const templates = require('../helpers/emailTemplates')

const router = express.Router()

router.use('/api/bookings', authMiddleware)

function asObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id)) ? String(id) : null
}

function serviceLabel(name) {
  return String(name || '').trim() || 'Service'
}

function bookingPartyRole(booking, userId) {
  if (!booking || !userId) return null
  if (String(booking.owner) === String(userId)) return 'owner'
  if (String(booking.professional?.userId || '') === String(userId)) return 'professional'
  return null
}

function ownerDisplayName(owner) {
  if (!owner || typeof owner !== 'object') return 'Pet owner'
  const n = String(owner.name || '').trim()
  if (n) return n
  const a = [owner.firstName, owner.lastName].filter(Boolean).join(' ').trim()
  return a || 'Pet owner'
}

function formatBookingDateFr(startAtValue) {
  try {
    return new Date(startAtValue).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return String(startAtValue || '')
  }
}

async function formatBookingForViewer(bookingId, viewerUserId) {
  const populated = await Booking.findById(bookingId)
    .populate('owner', 'name firstName lastName email')
    .populate('pet', 'name species')
    .lean()
  if (!populated) return null
  const role = bookingPartyRole(populated, viewerUserId)
  if (role === 'professional') {
    const pro = await Professional.findOne({ userId: viewerUserId }).lean()
    if (!pro) return null
    const owner = populated.owner && typeof populated.owner === 'object' ? populated.owner : {}
    return {
      ok: true,
      booking: {
        _id: populated._id,
        ownerUserId: owner._id ? String(owner._id) : null,
        user: {
          name: ownerDisplayName(owner),
          email: owner.email || '',
        },
        professional: { _id: pro._id },
        serviceId: populated.serviceId || null,
        serviceName: populated.serviceName,
        duration: populated.duration ?? null,
        startAt: populated.startAt,
        status: populated.status,
        createdAt: populated.createdAt,
        notes: String(populated.notes || '').trim(),
        cancelledBy: populated.cancelledBy,
        cancelReason: populated.cancelReason,
        lateReportedBy: populated.lateReportedBy,
        lateMinutes: populated.lateMinutes,
        noShowReportedBy: populated.noShowReportedBy,
        rescheduleHistory: populated.rescheduleHistory || [],
        pet:
          populated.pet && typeof populated.pet === 'object'
            ? { name: populated.pet.name || 'Pet', species: populated.pet.species }
            : null,
      },
    }
  }
  if (role === 'owner') {
    return { ok: true, booking: populated }
  }
  return null
}

router.put('/api/bookings/:id/status', async (req, res) => {
  const id = asObjectId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid booking id' })
  const nextStatus = String(req.body?.status || '')
  if (!['confirmed', 'cancelled', 'completed'].includes(nextStatus)) {
    return res.status(400).json({ error: 'status must be confirmed, cancelled, or completed' })
  }
  try {
    const userDoc = await User.findById(req.user.id).select('role').lean()
    if (!userDoc || userDoc.role !== 'professional') {
      return res.status(403).json({ error: 'only professionals can update booking status here' })
    }
    const pro = await Professional.findOne({ userId: req.user.id }).lean()
    if (!pro) return res.status(404).json({ error: 'professional profile not found' })

    const booking = await Booking.findById(id)
    if (!booking) return res.status(404).json({ error: 'booking not found' })

    const snapUserId = booking.professional?.userId
    if (!snapUserId || String(snapUserId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (nextStatus === 'confirmed' && booking.status !== 'pending') {
      return res.status(400).json({ error: 'only pending bookings can be confirmed' })
    }
    if (nextStatus === 'cancelled' && !['pending', 'confirmed', 'late', 'rescheduled'].includes(booking.status)) {
      return res.status(400).json({ error: 'cannot cancel this booking' })
    }
    if (nextStatus === 'completed' && !['confirmed', 'late', 'rescheduled'].includes(booking.status)) {
      return res.status(400).json({ error: 'only active bookings can be marked completed' })
    }

    booking.status = nextStatus
    if (nextStatus === 'cancelled') {
      booking.cancelledBy = 'professional'
      if (!String(booking.cancelReason || '').trim()) {
        booking.cancelReason = 'Declined by professional'
      }
    }
    await booking.save()

    if (nextStatus === 'completed' && booking.professional?.userId && booking.owner) {
      await ensureReviewWindowForBooking(booking)
    }

    const [ownerUser, proUser] = await Promise.all([
      User.findById(booking.owner).select('email name').lean(),
      User.findById(booking.professional?.userId).select('email name').lean(),
    ])
    const dateStr = formatBookingDateFr(booking.startAt)

    if (nextStatus === 'confirmed' && ownerUser?.email) {
      sendMail({
        to: ownerUser.email,
        subject: `Réservation confirmée — ${booking.serviceName}`,
        html: templates.bookingConfirmedOwner({
          ownerName: ownerUser.name || 'cher client',
          proName: booking.professional?.name || proUser?.name || 'Professionnel',
          serviceType: booking.serviceName,
          date: dateStr,
          timeSlot: null,
          petName: null,
        }),
      })
    }

    if (nextStatus === 'cancelled' && ownerUser?.email) {
      sendMail({
        to: ownerUser.email,
        subject: `Réservation annulée — ${booking.serviceName}`,
        html: templates.bookingCancelledOwner({
          ownerName: ownerUser.name || 'cher client',
          proName: booking.professional?.name || proUser?.name || 'Professionnel',
          serviceType: booking.serviceName,
          date: dateStr,
          cancelledBy: 'professional',
        }),
      })
    }

    if (nextStatus === 'completed' && ownerUser?.email) {
      sendMail({
        to: ownerUser.email,
        subject: `Donnez votre avis sur ${booking.professional?.name || proUser?.name || 'ce professionnel'} ⭐`,
        html: templates.reviewPromptOwner({
          ownerName: ownerUser.name || 'cher client',
          proName: booking.professional?.name || proUser?.name || 'Professionnel',
          bookingId: booking._id,
        }),
      })
    }

    const proUserId = booking.professional?.userId
    if (proUserId && booking.owner) {
      const systemTextMap = {
        confirmed: 'Booking confirmed ✓ — your appointment is set.',
        cancelled: 'Booking cancelled.',
        completed: 'Appointment completed ✓ Thank you!',
      }
      const systemTypeMap = {
        confirmed: 'booking_confirmed',
        cancelled: 'booking_cancelled',
        completed: 'booking_completed',
      }
      const st = systemTypeMap[nextStatus]
      const txt = systemTextMap[nextStatus]
      if (txt && st) {
        try {
          await Message.create({
            ownerId: booking.owner,
            professionalId: proUserId,
            bookingId: booking._id,
            senderId: req.user.id,
            text: txt,
            isSystem: true,
            systemType: st,
          })
        } catch (msgErr) {
          console.error('[bookings] system message', msgErr.message)
        }
      }
    }

    const populated = await Booking.findById(booking._id)
      .populate('owner', 'name firstName lastName email')
      .populate('pet', 'name species')
      .lean()

    const owner = populated.owner && typeof populated.owner === 'object' ? populated.owner : {}
    const shaped = {
      _id: populated._id,
      user: {
        name: ownerDisplayName(owner),
        email: owner.email || '',
      },
      professional: { _id: pro._id },
      serviceId: populated.serviceId || null,
      serviceName: populated.serviceName,
      duration: populated.duration ?? null,
      startAt: populated.startAt,
      status: populated.status,
      createdAt: populated.createdAt,
      cancelledBy: populated.cancelledBy,
      cancelReason: populated.cancelReason,
      lateReportedBy: populated.lateReportedBy,
      lateMinutes: populated.lateMinutes,
      noShowReportedBy: populated.noShowReportedBy,
      rescheduleHistory: populated.rescheduleHistory || [],
      pet: populated.pet && typeof populated.pet === 'object'
        ? { name: populated.pet.name || 'Pet', species: populated.pet.species }
        : null,
    }

    return res.json({ ok: true, booking: shaped })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to update status' })
  }
})

router.put('/api/bookings/:id/late', async (req, res) => {
  const id = asObjectId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid booking id' })
  const minutes = Math.max(0, Math.min(180, Number(req.body?.minutes) || 0))
  try {
    const booking = await Booking.findById(id)
    if (!booking) return res.status(404).json({ error: 'booking not found' })
    const role = bookingPartyRole(booking, req.user.id)
    if (!role) return res.status(403).json({ error: 'forbidden' })
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Can only report late on confirmed booking' })
    }
    const appt = appointmentStart(booking)
    if (!appt) return res.status(400).json({ error: 'invalid appointment time' })
    const diffMin = (Date.now() - appt.getTime()) / 60000
    if (diffMin < -30 || diffMin > 120) {
      return res.status(400).json({
        error: 'Late report only allowed 30min before or 2h after appointment',
      })
    }
    booking.status = 'late'
    booking.lateReportedBy = role
    booking.lateMinutes = minutes
    await booking.save()
    const payload = await formatBookingForViewer(booking._id, req.user.id)
    if (!payload) return res.status(500).json({ error: 'failed to format response' })
    return res.json(payload)
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed' })
  }
})

router.put('/api/bookings/:id/no-show', async (req, res) => {
  const id = asObjectId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid booking id' })
  try {
    const booking = await Booking.findById(id)
    if (!booking) return res.status(404).json({ error: 'booking not found' })
    const role = bookingPartyRole(booking, req.user.id)
    if (!role) return res.status(403).json({ error: 'forbidden' })
    if (!['confirmed', 'late'].includes(booking.status)) {
      return res.status(400).json({ error: 'Can only report no-show on confirmed or late booking' })
    }
    const appt = appointmentStart(booking)
    if (!appt) return res.status(400).json({ error: 'invalid appointment time' })
    if (Date.now() < appt.getTime()) {
      return res.status(400).json({ error: 'Cannot report no-show before appointment time' })
    }
    booking.status = 'no_show'
    booking.noShowReportedBy = role
    await booking.save()
    const payload = await formatBookingForViewer(booking._id, req.user.id)
    if (!payload) return res.status(500).json({ error: 'failed to format response' })
    return res.json(payload)
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed' })
  }
})

router.put('/api/bookings/:id/reschedule', async (req, res) => {
  const id = asObjectId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid booking id' })
  const { newStartAt, reason } = req.body || {}
  if (!newStartAt) {
    return res.status(400).json({ error: 'newStartAt required' })
  }
  try {
    const booking = await Booking.findById(id)
    if (!booking) return res.status(404).json({ error: 'booking not found' })
    const role = bookingPartyRole(booking, req.user.id)
    if (!role) return res.status(403).json({ error: 'forbidden' })
    if (!['pending', 'confirmed', 'late', 'rescheduled'].includes(booking.status)) {
      return res.status(400).json({ error: 'Can only reschedule pending, confirmed, late, or rescheduled booking' })
    }
    const nextStartAt = new Date(newStartAt)
    if (Number.isNaN(nextStartAt.getTime())) return res.status(400).json({ error: 'invalid newStartAt' })
    if (nextStartAt.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'New appointment must be in the future' })
    }
    const hist = {
      previousStartAt: booking.startAt,
      changedBy: role,
      changedAt: new Date(),
      reason: String(reason || '').trim(),
    }
    booking.rescheduleHistory = Array.isArray(booking.rescheduleHistory) ? booking.rescheduleHistory : []
    booking.rescheduleHistory.push(hist)
    booking.startAt = nextStartAt
    booking.status = 'rescheduled'
    await booking.save()
    const payload = await formatBookingForViewer(booking._id, req.user.id)
    if (!payload) return res.status(500).json({ error: 'failed to format response' })
    return res.json(payload)
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed' })
  }
})

router.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.user.id })
      .populate('pet', 'name species')
      .sort({ startAt: -1 })
      .lean()
    return res.json({ ok: true, bookings })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load bookings' })
  }
})

router.post('/api/bookings', async (req, res) => {
  try {
    const {
      professionalId,
      pet: petId,
      serviceId,
      startAt,
      notes,
    } = req.body || {}

    const userDoc = await User.findById(req.user.id).select('role').lean()
    if (!userDoc || String(userDoc.role || '') !== 'owner') {
      return res.status(403).json({ error: 'Only pet owners can make bookings' })
    }

    const professional = await Professional.findById(professionalId)
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' })
    }

    const pid = asObjectId(petId)
    if (!pid) return res.status(400).json({ error: 'invalid pet id' })
    const sid = asObjectId(serviceId)
    const startAtDate = new Date(startAt)
    if (!startAt || Number.isNaN(startAtDate.getTime())) {
      return res.status(400).json({ error: 'startAt is required' })
    }
    const serviceDoc = sid ? professional.services?.id?.(sid) : null

    const petDoc = await Pet.findOne({ _id: pid, owner: req.user.id })
    if (!petDoc) {
      return res.status(403).json({ error: 'Pet does not belong to this owner' })
    }

    const booking = await Booking.create({
      owner: req.user.id,
      pet: pid,
      serviceId: serviceDoc?._id || null,
      serviceName: String(serviceDoc?.name || professional.specialty || 'General service').trim(),
      duration: serviceDoc?.duration == null ? null : Number(serviceDoc.duration),
      startAt: startAtDate,
      professional: {
        userId: professional.userId ? String(professional.userId) : null,
        name: String(professional.name || '').trim(),
        specialty: professional.specialty,
        location: String(professional.location || professional.city || '').trim(),
      },
      notes: String(notes || '').trim(),
      price: Number(serviceDoc?.price || 0),
      status: 'pending',
    })

    const populated = await Booking.findById(booking._id)
      .populate('pet', 'name species')
      .lean()

    const petName = petDoc.name
    await logActivity(
      req.user.id,
      'booking_created',
      `Booking created · ${serviceLabel(booking.serviceName)}`,
      petName,
      '📅',
      { bookingId: String(booking._id) },
    )

    const [proUser, ownerUser] = await Promise.all([
      User.findById(booking.professional.userId).select('email name').lean(),
      User.findById(req.user.id).select('email name').lean(),
    ])
    const dateStr = formatBookingDateFr(booking.startAt)
    if (proUser?.email) {
      const emailTo = proUser.email
      const proName = proUser.name || booking.professional.name
      const ownerName = ownerUser?.name || 'Un client'
      sendMail({
        to: emailTo,
        subject: `Nouvelle demande de réservation — ${booking.serviceName}`,
        html: templates.newBookingRequestPro({
          proName,
          ownerName,
          serviceType: booking.serviceName,
          date: dateStr,
          timeSlot: null,
          petName: petDoc?.name || null,
        }),
      })
    }

    return res.status(201).json({ ok: true, booking: populated })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to create booking' })
  }
})

router.get('/api/bookings/:id', async (req, res) => {
  const id = asObjectId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid booking id' })
  try {
    const booking = await Booking.findOne({ _id: id, owner: req.user.id })
      .populate('pet', 'name species')
      .lean()
    if (!booking) return res.status(404).json({ error: 'booking not found' })
    return res.json({ ok: true, booking })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load booking' })
  }
})

router.patch('/api/bookings/:id', async (req, res) => {
  const id = asObjectId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid booking id' })
  try {
    const booking = await Booking.findOne({ _id: id, owner: req.user.id })
    if (!booking) return res.status(404).json({ error: 'booking not found' })
    if (!['pending', 'confirmed', 'late', 'rescheduled'].includes(booking.status)) {
      return res.status(400).json({ error: 'this booking cannot be rescheduled here' })
    }

    const updates = {}
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'startAt') && req.body.startAt) {
      const next = new Date(req.body.startAt)
      if (Number.isNaN(next.getTime())) return res.status(400).json({ error: 'invalid startAt' })
      updates.startAt = next
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'nothing to update' })
    }

    Object.assign(booking, updates)
    await booking.save()

    const populated = await Booking.findById(booking._id)
      .populate('pet', 'name species')
      .lean()

    const petDoc = await Pet.findById(booking.pet).select('name').lean()
    const petName = petDoc?.name || ''
    await logActivity(
      req.user.id,
      'pet_updated',
      `Booking rescheduled · ${serviceLabel(booking.serviceName)}`,
      petName,
      '📅',
      { bookingId: String(booking._id) },
    )

    return res.json({ ok: true, booking: populated })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to update booking' })
  }
})

router.patch('/api/bookings/:id/cancel', async (req, res) => {
  const id = asObjectId(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid booking id' })
  const { cancelledBy, cancelReason } = req.body || {}
  if (!['owner', 'professional'].includes(String(cancelledBy || ''))) {
    return res.status(400).json({ error: 'cancelledBy must be owner or professional' })
  }
  try {
    const booking = await Booking.findOne({ _id: id, owner: req.user.id })
    if (!booking) return res.status(404).json({ error: 'booking not found' })
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'booking already cancelled' })
    }
    if (['completed', 'cancelled', 'no_show'].includes(booking.status)) {
      return res.status(400).json({ error: 'cannot cancel this booking' })
    }
    if (!['pending', 'confirmed', 'late', 'rescheduled'].includes(booking.status)) {
      return res.status(400).json({ error: 'cannot cancel this booking' })
    }

    booking.status = 'cancelled'
    booking.cancelledBy = cancelledBy
    booking.cancelReason = String(cancelReason || '').trim()
    await booking.save()

    const populated = await Booking.findById(booking._id)
      .populate('pet', 'name species')
      .lean()

    const petDoc = await Pet.findById(booking.pet).select('name').lean()
    const petName = petDoc?.name || ''
    await logActivity(
      req.user.id,
      'booking_cancelled',
      `Booking cancelled · ${serviceLabel(booking.serviceName)}`,
      petName,
      '❌',
      { bookingId: String(booking._id) },
    )

    const [ownerUser, proUser] = await Promise.all([
      User.findById(booking.owner).select('email name').lean(),
      User.findById(booking.professional?.userId).select('email name').lean(),
    ])
    const dateStr = formatBookingDateFr(booking.startAt)

    if (proUser?.email) {
      sendMail({
        to: proUser.email,
        subject: `Réservation annulée par le client — ${booking.serviceName}`,
        html: templates.bookingCancelledPro({
          proName: proUser.name || booking.professional?.name || 'Professionnel',
          ownerName: ownerUser?.name || 'le client',
          serviceType: booking.serviceName,
          date: dateStr,
        }),
      })
    }

    return res.json({ ok: true, booking: populated })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to cancel booking' })
  }
})

module.exports = router
