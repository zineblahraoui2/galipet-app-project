const express = require('express')
const mongoose = require('mongoose')
const authMiddleware = require('../middleware/authMiddleware')
const User = require('../models/users')
const Booking = require('../models/bookings')
const Professional = require('../models/professionals')
const Review = require('../models/Review')

const router = express.Router()
router.use('/api/reviews', authMiddleware)

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

async function recalcProfessionalRating(proUserId) {
  const pid = asOid(proUserId)
  if (!pid) return
  const reviews = await Review.find({
    professionalId: pid,
    isRevealed: true,
    'ownerReview.rating': { $ne: null },
  })
    .select('ownerReview.rating')
    .lean()
  if (!reviews.length) {
    await Professional.findOneAndUpdate({ userId: pid }, { $set: { rating: 0, reviewsCount: 0 } })
    return
  }
  const sum = reviews.reduce((s, r) => s + (Number(r.ownerReview?.rating) || 0), 0)
  const avg = Math.round((sum / reviews.length) * 10) / 10
  await Professional.findOneAndUpdate(
    { userId: pid },
    { $set: { rating: avg, reviewsCount: reviews.length } },
  )
}

async function revealExpiredReviews() {
  const res = await Review.updateMany(
    { isRevealed: false, windowExpiresAt: { $lt: new Date() } },
    { $set: { isRevealed: true } },
  )
  if (res.modifiedCount > 0) {
    const ids = await Review.distinct('professionalId', {
      isRevealed: true,
      'ownerReview.rating': { $ne: null },
    })
    for (const id of ids) {
      await recalcProfessionalRating(id)
    }
  }
}

async function applyRevealIfNeeded(reviewDoc) {
  if (reviewDoc.isRevealed) return
  const ownerDone = reviewDoc.ownerReview?.submittedAt != null
  const proDone = reviewDoc.proReview?.submittedAt != null
  const expired = reviewDoc.windowExpiresAt && new Date(reviewDoc.windowExpiresAt) <= new Date()
  if ((ownerDone && proDone) || expired) {
    reviewDoc.isRevealed = true
    await reviewDoc.save()
    await recalcProfessionalRating(reviewDoc.professionalId)
  }
}

async function afterReviewMutation(reviewDoc) {
  await applyRevealIfNeeded(reviewDoc)
}

router.get('/api/reviews/booking/:bookingId', async (req, res) => {
  try {
    const bid = asOid(req.params.bookingId)
    if (!bid) return res.status(400).json({ error: 'invalid booking id' })
    const booking = await Booking.findById(bid)
      .populate('pet', 'name species')
      .populate('owner', 'name firstName lastName email avatar')
      .lean()
    if (!booking) return res.status(404).json({ error: 'booking not found' })
    const proUid = booking.professional?.userId
    const uid = String(req.user.id)
    if (String(booking.owner?._id || booking.owner) !== uid && String(proUid || '') !== uid) {
      return res.status(403).json({ error: 'forbidden' })
    }
    if (String(booking.status) !== 'completed') {
      return res.status(400).json({ error: 'booking must be completed to review' })
    }
    const review = await Review.findOne({ bookingId: bid }).lean()
    if (!review) {
      return res.status(404).json({ error: 'review window not started yet' })
    }
    const owner = booking.owner && typeof booking.owner === 'object' ? booking.owner : {}
    const pet = booking.pet && typeof booking.pet === 'object' ? booking.pet : {}
    const proUser = proUid ? await User.findById(proUid).select('name firstName lastName avatar').lean() : null
    return res.json({
      ok: true,
      booking: {
        _id: booking._id,
        serviceName: booking.serviceName,
        startAt: booking.startAt,
        duration: booking.duration ?? null,
        petName: pet.name || 'Pet',
        ownerName: displayName(owner),
        proName: displayName(proUser),
      },
      review: {
        isRevealed: review.isRevealed,
        windowExpiresAt: review.windowExpiresAt,
        ownerSubmitted: Boolean(review.ownerReview?.submittedAt),
        proSubmitted: Boolean(review.proReview?.submittedAt),
      },
    })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed' })
  }
})

router.get('/api/reviews/pending', async (req, res) => {
  try {
    await revealExpiredReviews()
    const uid = asOid(req.user.id)
    if (!uid) return res.json({ ok: true, pending: [] })
    const me = await User.findById(uid).select('role').lean()
    const role = String(me?.role || '').toLowerCase()

    const completed = await Booking.find({ status: 'completed' })
      .select('_id serviceName startAt professional owner')
      .lean()
    const relevant = completed.filter((b) => {
      if (role === 'owner') return String(b.owner) === String(uid)
      if (role === 'professional') return String(b.professional?.userId || '') === String(uid)
      return false
    })
    const bIds = relevant.map((b) => b._id)
    if (!bIds.length) return res.json({ ok: true, pending: [] })

    const reviews = await Review.find({ bookingId: { $in: bIds } }).lean()
    const byBooking = new Map(reviews.map((r) => [String(r.bookingId), r]))

    const out = []
    for (const b of relevant) {
      const r = byBooking.get(String(b._id))
      if (!r) continue
      if (role === 'owner') {
        if (r.ownerReview?.submittedAt) continue
      } else if (role === 'professional') {
        if (r.proReview?.submittedAt) continue
      } else {
        continue
      }
      const otherId = role === 'owner' ? b.professional?.userId : b.owner
      const other = otherId ? await User.findById(otherId).select('name firstName lastName avatar').lean() : null
      const msLeft = new Date(r.windowExpiresAt).getTime() - Date.now()
      const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)))
      out.push({
        _id: r._id,
        bookingId: b._id,
        serviceName: b.serviceName,
        startAt: b.startAt,
        otherParty: {
          name: displayName(other),
          avatar: other?.avatar || '',
        },
        windowExpiresAt: r.windowExpiresAt,
        daysLeft,
      })
    }
    return res.json({ ok: true, pending: out })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed' })
  }
})

router.get('/api/reviews/my-pending', async (req, res) => {
  try {
    await revealExpiredReviews()
    const uid = asOid(req.user.id)
    if (!uid) return res.json({ ok: true, count: 0 })
    const me = await User.findById(uid).select('role').lean()
    const role = String(me?.role || '').toLowerCase()
    const completed = await Booking.find({ status: 'completed' }).select('_id professional owner').lean()
    const relevant = completed.filter((b) =>
      role === 'owner'
        ? String(b.owner) === String(uid)
        : String(b.professional?.userId || '') === String(uid),
    )
    const reviews = await Review.find({ bookingId: { $in: relevant.map((x) => x._id) } }).lean()
    const byBooking = new Map(reviews.map((rev) => [String(rev.bookingId), rev]))
    let count = 0
    for (const b of relevant) {
      const rev = byBooking.get(String(b._id))
      if (!rev) continue
      if (role === 'owner' && !rev.ownerReview?.submittedAt) count += 1
      if (role === 'professional' && !rev.proReview?.submittedAt) count += 1
    }
    return res.json({ ok: true, count })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed' })
  }
})

const OWNER_TAGS = new Set([
  'great_with_anxious_pets',
  'handles_large_dogs',
  'very_gentle',
  'explains_clearly',
  'clean_space',
  'on_time',
  'goes_above_and_beyond',
  'would_recommend',
])

const PRO_TAGS = new Set([
  'punctual',
  'clear_instructions',
  'well_behaved_pet',
  'responsive',
  'respectful',
  'would_accept_again',
])

function buildProfessionalSummary(rows) {
  if (!rows.length) {
    return {
      avgRating: 0,
      count: 0,
      recommendPct: null,
      criteriaAvg: { expertise: 0, punctuality: 0, communication: 0, value: 0 },
    }
  }
  let sum = 0
  let recYes = 0
  let recTotal = 0
  const crit = { expertise: [], punctuality: [], communication: [], value: [] }
  for (const r of rows) {
    const or = r.ownerReview || {}
    sum += Number(or.rating) || 0
    if (or.wouldBookAgain === true) recYes += 1
    if (or.wouldBookAgain === true || or.wouldBookAgain === false) recTotal += 1
    for (const k of ['expertise', 'punctuality', 'communication', 'value']) {
      const v = or.criteria?.[k]
      if (v != null && v >= 1 && v <= 5) crit[k].push(v)
    }
  }
  const n = rows.length
  const avgRating = Math.round((sum / n) * 10) / 10
  const criteriaAvg = {}
  for (const k of Object.keys(crit)) {
    const arr = crit[k]
    criteriaAvg[k] = arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0
  }
  return {
    avgRating,
    count: n,
    recommendPct: recTotal ? Math.round((recYes / recTotal) * 100) : null,
    criteriaAvg,
  }
}

router.get('/api/reviews/professional/:userId', async (req, res) => {
  try {
    await revealExpiredReviews()
    const pid = asOid(req.params.userId)
    if (!pid) return res.status(400).json({ error: 'invalid user id' })
    const rows = await Review.find({
      professionalId: pid,
      isRevealed: true,
      'ownerReview.rating': { $ne: null },
    })
      .sort({ createdAt: -1 })
      .populate('ownerId', 'name firstName lastName avatar')
      .populate({
        path: 'bookingId',
        select: 'startAt serviceName pet',
        populate: { path: 'pet', select: 'name species' },
      })
      .lean()

    const reviews = rows.map((r) => {
      const b = r.bookingId && typeof r.bookingId === 'object' ? r.bookingId : {}
      const pet = b.pet && typeof b.pet === 'object' ? b.pet : {}
      const owner = r.ownerId && typeof r.ownerId === 'object' ? r.ownerId : {}
      const or = r.ownerReview || {}
      return {
        _id: r._id,
        bookingId: b._id || r.bookingId,
        rating: or.rating,
        comment: or.comment || '',
        criteria: or.criteria || {},
        tags: or.tags || [],
        wouldBookAgain: or.wouldBookAgain,
        ownerName: displayName(owner),
        petName: pet.name || 'Pet',
        startAt: b.startAt || r.createdAt,
        serviceName: b.serviceName,
        proResponse: or.proResponse || '',
        proRespondedAt: or.proRespondedAt || null,
      }
    })
    const summary = buildProfessionalSummary(rows)
    return res.json({ ok: true, summary, reviews })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed' })
  }
})

router.get('/api/reviews/owner/:userId', async (req, res) => {
  try {
    await revealExpiredReviews()
    const oid = asOid(req.params.userId)
    if (!oid) return res.status(400).json({ error: 'invalid user id' })
    const rows = await Review.find({
      ownerId: oid,
      isRevealed: true,
      'proReview.rating': { $ne: null },
    })
      .sort({ createdAt: -1 })
      .populate('professionalId', 'name firstName lastName avatar')
      .populate({
        path: 'bookingId',
        select: 'startAt serviceName pet',
        populate: { path: 'pet', select: 'name species' },
      })
      .lean()

    const trustedCount = await Review.countDocuments({
      ownerId: oid,
      isRevealed: true,
      'proReview.rating': { $ne: null },
    })
    const trustedClient = trustedCount >= 5

    const reviews = rows.map((r) => {
      const b = r.bookingId && typeof r.bookingId === 'object' ? r.bookingId : {}
      const pet = b.pet && typeof b.pet === 'object' ? b.pet : {}
      const pro = r.professionalId && typeof r.professionalId === 'object' ? r.professionalId : {}
      const pr = r.proReview || {}
      return {
        _id: r._id,
        bookingId: b._id || r.bookingId,
        rating: pr.rating,
        comment: pr.comment || '',
        tags: pr.tags || [],
        wouldAcceptAgain: pr.wouldAcceptAgain,
        proName: displayName(pro),
        petName: pet.name || 'Pet',
        startAt: b.startAt || r.createdAt,
        serviceName: b.serviceName,
      }
    })
    return res.json({
      ok: true,
      reviews,
      trustedClient: String(req.user.id) === String(oid) ? trustedClient : undefined,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed' })
  }
})

router.post('/api/reviews/:bookingId/owner', async (req, res) => {
  try {
    const bid = asOid(req.params.bookingId)
    if (!bid) return res.status(400).json({ error: 'invalid booking id' })
    const booking = await Booking.findById(bid).lean()
    if (!booking) return res.status(404).json({ error: 'booking not found' })
    if (String(booking.owner) !== String(req.user.id)) return res.status(403).json({ error: 'forbidden' })
    if (String(booking.status) !== 'completed') return res.status(400).json({ error: 'booking must be completed' })

    const review = await Review.findOne({ bookingId: bid })
    if (!review) return res.status(404).json({ error: 'review not found' })
    if (review.ownerReview?.submittedAt) return res.status(400).json({ error: 'already submitted' })

    const rating = Number(req.body?.rating)
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating 1-5 required' })
    }
    if (req.body?.wouldBookAgain !== true && req.body?.wouldBookAgain !== false) {
      return res.status(400).json({ error: 'wouldBookAgain is required' })
    }

    const criteria = {}
    for (const k of ['expertise', 'punctuality', 'communication', 'value']) {
      const v = req.body?.criteria?.[k]
      if (v == null || v === '') continue
      const n = Number(v)
      if (Number.isFinite(n) && n >= 1 && n <= 5) criteria[k] = n
    }

    const tags = Array.isArray(req.body?.tags)
      ? req.body.tags.map((t) => String(t)).filter((t) => OWNER_TAGS.has(t))
      : []

    review.ownerReview = review.ownerReview || {}
    review.ownerReview.rating = rating
    review.ownerReview.comment = String(req.body?.comment || '').slice(0, 1000)
    review.ownerReview.criteria = { ...review.ownerReview.criteria, ...criteria }
    review.ownerReview.tags = tags
    review.ownerReview.wouldBookAgain = req.body.wouldBookAgain
    review.ownerReview.submittedAt = new Date()
    await review.save()
    await afterReviewMutation(review)
    return res.json({ ok: true })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed' })
  }
})

router.post('/api/reviews/:bookingId/pro', async (req, res) => {
  try {
    const bid = asOid(req.params.bookingId)
    if (!bid) return res.status(400).json({ error: 'invalid booking id' })
    const booking = await Booking.findById(bid).lean()
    if (!booking) return res.status(404).json({ error: 'booking not found' })
    const proUid = booking.professional?.userId
    if (!proUid || String(proUid) !== String(req.user.id)) return res.status(403).json({ error: 'forbidden' })
    if (String(booking.status) !== 'completed') return res.status(400).json({ error: 'booking must be completed' })

    const review = await Review.findOne({ bookingId: bid })
    if (!review) return res.status(404).json({ error: 'review not found' })
    if (review.proReview?.submittedAt) return res.status(400).json({ error: 'already submitted' })

    const rating = Number(req.body?.rating)
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating 1-5 required' })
    }
    if (req.body?.wouldAcceptAgain !== true && req.body?.wouldAcceptAgain !== false) {
      return res.status(400).json({ error: 'wouldAcceptAgain is required' })
    }

    const tags = Array.isArray(req.body?.tags)
      ? req.body.tags.map((t) => String(t)).filter((t) => PRO_TAGS.has(t))
      : []

    review.proReview = review.proReview || {}
    review.proReview.rating = rating
    review.proReview.comment = String(req.body?.comment || '').slice(0, 500)
    review.proReview.tags = tags
    review.proReview.wouldAcceptAgain = req.body.wouldAcceptAgain
    review.proReview.submittedAt = new Date()
    await review.save()
    await afterReviewMutation(review)
    return res.json({ ok: true })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed' })
  }
})

router.post('/api/reviews/:bookingId/respond', async (req, res) => {
  try {
    const bid = asOid(req.params.bookingId)
    if (!bid) return res.status(400).json({ error: 'invalid booking id' })
    const booking = await Booking.findById(bid).lean()
    if (!booking) return res.status(404).json({ error: 'booking not found' })
    const proUid = booking.professional?.userId
    if (!proUid || String(proUid) !== String(req.user.id)) return res.status(403).json({ error: 'forbidden' })

    const review = await Review.findOne({ bookingId: bid })
    if (!review) return res.status(404).json({ error: 'review not found' })
    if (!review.isRevealed) return res.status(400).json({ error: 'reviews not revealed yet' })
    if (!review.ownerReview?.submittedAt) return res.status(400).json({ error: 'owner review not ready' })
    if (review.ownerReview?.proResponse) return res.status(400).json({ error: 'already responded' })

    const text = String(req.body?.response || '').trim().slice(0, 500)
    if (!text) return res.status(400).json({ error: 'response required' })

    review.ownerReview = review.ownerReview || {}
    review.ownerReview.proResponse = text
    review.ownerReview.proRespondedAt = new Date()
    await review.save()
    return res.json({ ok: true })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed' })
  }
})

module.exports = router
