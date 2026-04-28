const fs = require('fs')
const path = require('path')
const express = require('express')
const multer = require('multer')
const mongoose = require('mongoose')
const Pet = require('../models/pets')
const authMiddleware = require('../middleware/authMiddleware')
const logActivity = require('../helpers/logActivity')

const router = express.Router()

const petsUploadsDir = path.join(__dirname, '..', 'uploads', 'pets')
const petsDocsDir = path.join(petsUploadsDir, 'documents')
fs.mkdirSync(petsUploadsDir, { recursive: true })
fs.mkdirSync(petsDocsDir, { recursive: true })

const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, petsUploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    cb(null, `pet-${req.params.id}-${Date.now()}${ext || '.jpg'}`)
  },
})

const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, petsDocsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const base = path.basename(file.originalname || 'document', ext)
    cb(null, `${base.replace(/\s+/g, '-')}-${Date.now()}${ext}`)
  },
})

const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) return cb(null, true)
    return cb(new Error('Only image files are allowed'))
  },
})

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 12 * 1024 * 1024 },
})

function asObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id)) ? String(id) : null
}

function computeVaccines(vaccines = []) {
  return vaccines.map((vaccine) => ({
    ...vaccine,
    status: Pet.computeVaccineStatus(vaccine.nextDate),
  }))
}

function sanitizePet(petDoc) {
  const pet = petDoc.toObject ? petDoc.toObject() : petDoc
  const vaccines = computeVaccines(pet.vaccines || [])
  const worstStatus = vaccines.some((v) => v.status === 'expired')
    ? 'expired'
    : vaccines.some((v) => v.status === 'due')
      ? 'due'
      : 'ok'
  return {
    ...pet,
    vaccines,
    vaccinationStatus: worstStatus,
  }
}

async function findOwnedPet(petId, ownerId) {
  return Pet.findOne({ _id: petId, owner: ownerId })
}

router.use('/api/pets', authMiddleware)

router.get('/api/pets', async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.user.id }).sort({ createdAt: 1 })
    return res.json({ ok: true, pets: pets.map((pet) => sanitizePet(pet)) })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load pets' })
  }
})

router.post('/api/pets', async (req, res) => {
  try {
    const {
      name,
      species,
      breed,
      dateOfBirth,
      gender,
      color,
      weight,
      microchip,
      neutered,
      usualVet,
      allergies,
    } = req.body || {}

    const pet = await Pet.create({
      owner: req.user.id,
      name: String(name ?? '').trim(),
      species,
      breed: String(breed ?? '').trim(),
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined,
      color: String(color ?? '').trim(),
      weight: weight === '' ? undefined : weight,
      microchip: String(microchip ?? '').trim(),
      neutered: Boolean(neutered),
      usualVet: String(usualVet ?? '').trim(),
      allergies: String(allergies ?? '').trim(),
    })

    await logActivity(
      req.user.id,
      'pet_added',
      `${pet.name} added`,
      pet.name,
      '🐾',
    )

    return res.status(201).json(sanitizePet(pet))
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

router.get('/api/pets/:id', async (req, res) => {
  const petId = asObjectId(req.params.id)
  if (!petId) return res.status(400).json({ error: 'invalid pet id' })
  try {
    const pet = await findOwnedPet(petId, req.user.id)
    if (!pet) return res.status(404).json({ error: 'pet not found' })
    return res.json({ ok: true, pet: sanitizePet(pet) })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load pet' })
  }
})

router.patch('/api/pets/:id', async (req, res) => {
  const petId = asObjectId(req.params.id)
  if (!petId) return res.status(400).json({ error: 'invalid pet id' })

  const updateFields = [
    'name',
    'species',
    'breed',
    'dateOfBirth',
    'gender',
    'weight',
    'color',
    'microchip',
    'neutered',
    'usualVet',
    'allergies',
    'photo',
    'vetHistory',
  ]
  const updates = {}
  updateFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
      updates[field] = req.body[field]
    }
  })

  if (Array.isArray(updates.vetHistory)) {
    updates.vetHistory = updates.vetHistory.map((entry) => ({
      title: String(entry?.title ?? '').trim(),
      proName: String(entry?.proName ?? '').trim(),
      date: entry?.date,
      notes: String(entry?.notes ?? '').trim(),
      source: entry?.source === 'booking' ? 'booking' : 'manual',
    }))
  }

  if (Array.isArray(req.body?.vaccines)) {
    updates.vaccines = computeVaccines(req.body.vaccines)
  }

  try {
    const pet = await Pet.findOneAndUpdate(
      { _id: petId, owner: req.user.id },
      updates,
      { new: true, runValidators: true },
    )
    if (!pet) return res.status(404).json({ error: 'pet not found' })
    await logActivity(
      req.user.id,
      'pet_updated',
      `${pet.name} updated`,
      pet.name,
      '✏️',
    )
    return res.json({ ok: true, pet: sanitizePet(pet) })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to update pet' })
  }
})

router.delete('/api/pets/:id', async (req, res) => {
  const petId = asObjectId(req.params.id)
  if (!petId) return res.status(400).json({ error: 'invalid pet id' })
  try {
    const deleted = await Pet.findOneAndDelete({ _id: petId, owner: req.user.id })
    if (!deleted) return res.status(404).json({ error: 'pet not found' })
    await logActivity(
      req.user.id,
      'pet_removed',
      `${deleted.name} removed`,
      deleted.name,
      '🗑️',
    )
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to delete pet' })
  }
})

router.post('/api/pets/:id/vaccines', async (req, res) => {
  const petId = asObjectId(req.params.id)
  if (!petId) return res.status(400).json({ error: 'invalid pet id' })
  try {
    const pet = await findOwnedPet(petId, req.user.id)
    if (!pet) return res.status(404).json({ error: 'pet not found' })
    pet.vaccines.push({
      name: String(req.body?.name ?? '').trim(),
      givenDate: req.body?.givenDate || undefined,
      nextDate: req.body?.nextDate || undefined,
    })
    await pet.save()
    const vName = String(req.body?.name ?? '').trim()
    await logActivity(
      req.user.id,
      'vaccine_added',
      vName ? `Vaccine: ${vName}` : 'Vaccine added',
      pet.name,
      '💉',
      { petId: String(pet._id) },
    )
    return res.status(201).json({ ok: true, pet: sanitizePet(pet) })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to add vaccine' })
  }
})

router.delete('/api/pets/:id/vaccines/:vaccineId', async (req, res) => {
  const petId = asObjectId(req.params.id)
  const vaccineId = asObjectId(req.params.vaccineId)
  if (!petId || !vaccineId) {
    return res.status(400).json({ error: 'invalid id' })
  }
  try {
    const pet = await findOwnedPet(petId, req.user.id)
    if (!pet) return res.status(404).json({ error: 'pet not found' })
    pet.vaccines = pet.vaccines.filter((item) => String(item._id) !== vaccineId)
    await pet.save()
    await logActivity(
      req.user.id,
      'pet_updated',
      'Vaccine removed',
      pet.name,
      '💉',
      { petId: String(pet._id) },
    )
    return res.json({ ok: true, pet: sanitizePet(pet) })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to remove vaccine' })
  }
})

router.post(
  '/api/pets/:id/photo',
  uploadPhoto.single('photo'),
  async (req, res) => {
    const petId = asObjectId(req.params.id)
    if (!petId) return res.status(400).json({ error: 'invalid pet id' })
    if (!req.file) return res.status(400).json({ error: 'photo file is required' })
    try {
      const pet = await Pet.findOneAndUpdate(
        { _id: petId, owner: req.user.id },
        { photo: `/uploads/pets/${req.file.filename}` },
        { new: true, runValidators: true },
      )
      if (!pet) return res.status(404).json({ error: 'pet not found' })
      await logActivity(
        req.user.id,
        'pet_updated',
        `${pet.name} photo updated`,
        pet.name,
        '📷',
      )
      return res.json({ ok: true, pet: sanitizePet(pet) })
    } catch (err) {
      return res.status(500).json({ error: err.message || 'failed to upload photo' })
    }
  },
)

router.post(
  '/api/pets/:id/documents',
  uploadDocument.single('document'),
  async (req, res) => {
    const petId = asObjectId(req.params.id)
    if (!petId) return res.status(400).json({ error: 'invalid pet id' })
    if (!req.file) return res.status(400).json({ error: 'document is required' })
    try {
      const pet = await findOwnedPet(petId, req.user.id)
      if (!pet) return res.status(404).json({ error: 'pet not found' })
      pet.documents.push({
        name: String(req.body?.name || req.file.originalname || 'Document').trim(),
        fileUrl: `/uploads/pets/documents/${req.file.filename}`,
        fileType: req.file.mimetype || '',
        fileSize: req.file.size || 0,
        uploadedAt: new Date(),
      })
      await pet.save()
      const docName = String(req.body?.name || req.file.originalname || 'Document').trim()
      await logActivity(
        req.user.id,
        'document_uploaded',
        `Document: ${docName}`,
        pet.name,
        '📄',
        { petId: String(pet._id) },
      )
      return res.status(201).json({ ok: true, pet: sanitizePet(pet) })
    } catch (err) {
      return res
        .status(500)
        .json({ error: err.message || 'failed to upload document' })
    }
  },
)

router.delete('/api/pets/:id/documents/:docId', async (req, res) => {
  const petId = asObjectId(req.params.id)
  const docId = asObjectId(req.params.docId)
  if (!petId || !docId) return res.status(400).json({ error: 'invalid id' })
  try {
    const pet = await findOwnedPet(petId, req.user.id)
    if (!pet) return res.status(404).json({ error: 'pet not found' })
    pet.documents = pet.documents.filter((doc) => String(doc._id) !== docId)
    await pet.save()
    await logActivity(
      req.user.id,
      'pet_updated',
      'Document removed',
      pet.name,
      '📄',
      { petId: String(pet._id) },
    )
    return res.json({ ok: true, pet: sanitizePet(pet) })
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || 'failed to remove document' })
  }
})

module.exports = router
