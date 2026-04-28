const express = require('express')
const mongoose = require('mongoose')
const Professional = require('../models/professionals')

const router = express.Router()

const allowedTypes = new Set(['vet', 'grooming', 'sitting', 'training'])
const SPECIAL_REGEX_CHARS = /[.*+?^${}()|[\]\\]/g

/** Public fields for list + detail; always include `userId` (User _id) for messaging, not Professional _id. */
const PROFESSIONAL_PUBLIC_SELECT =
  'name specialty location city rating reviewsCount phone description avatar userId lat lng languages speciesWorked practiceName practiceAddress mapLink consultationFee homeVisit homeVisitFee paymentMethods verificationStatus education certifications licenseNumber experience isVerified services'

function escapeRegExp(value) {
  return String(value || '').replace(SPECIAL_REGEX_CHARS, '\\$&')
}

/** "Fes, Morocco" → match DB `city` against `Fes` only. */
function localityFromCityQuery(cityParam) {
  const raw = String(cityParam || '').trim()
  if (!raw) return ''
  return raw.split(',')[0].trim()
}

router.get('/api/professionals', async (req, res) => {
  try {
    const type = String(req.query.type || '').toLowerCase()
    const cityRaw = String(req.query.city || '').trim()
    const city = localityFromCityQuery(cityRaw)
    const filter = type && allowedTypes.has(type) ? { specialty: type } : {}
    if (city) {
      filter.city = { $regex: new RegExp(escapeRegExp(city), 'i') }
    }
    // Away pros are hidden from owner search (instant toggle from pro calendar).
    filter.isAway = { $ne: true }
    const professionals = await Professional.find(filter)
      .select(PROFESSIONAL_PUBLIC_SELECT)
      .sort({ rating: -1 })
      .lean()
    return res.json({ ok: true, professionals })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load professionals' })
  }
})

router.get('/api/professionals/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim()
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'invalid professional id' })
    }
    const professional = await Professional.findById(id).select(PROFESSIONAL_PUBLIC_SELECT).lean()
    if (!professional) {
      return res.status(404).json({ error: 'professional not found' })
    }
    return res.json({ ok: true, professional })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load professional' })
  }
})

module.exports = router
