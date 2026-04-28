const fs = require('fs')
const path = require('path')
const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const multer = require('multer')
const User = require('../models/users')
const Professional = require('../models/professionals')
const { sendMail } = require('../helpers/mailer')
const templates = require('../helpers/emailTemplates')

const router = express.Router()

/** Mapbox forward geocode; failures are ignored so registration always completes. */
async function geocodeAndUpdateProfessional(proId, location, city, country) {
  const token = String(process.env.MAPBOX_TOKEN || process.env.VITE_MAPBOX_TOKEN || '').trim()
  const query = encodeURIComponent(
    [location, city, country || 'Morocco'].filter(Boolean).join(', '),
  )
  if (!token || !query || !proId) return
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json` +
      `?access_token=${token}&limit=1&country=ma`
    const geo = await fetch(url)
    if (!geo.ok) return
    const geoData = await geo.json()
    if (geoData.features && geoData.features.length > 0) {
      const [lng, lat] = geoData.features[0].center
      if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
        await Professional.findByIdAndUpdate(proId, { lat, lng })
      }
    }
  } catch {
    /* ignore — registration must not fail on geocode */
  }
}

const BCRYPT_ROUNDS = 10
const AUTH_COOKIE_NAME = 'token'
const DEFAULT_JWT_EXPIRES = '7d'
const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function webAppOrigin() {
  return (process.env.WEB_APP_URL || 'http://localhost:5173').replace(/\/$/, '')
}

function jwtSecret() {
  const s = process.env.JWT_SECRET
  return s != null && String(s).trim() ? String(s).trim() : null
}

function readCookie(req, name) {
  const raw = req.headers.cookie
  if (!raw || !name) return ''
  for (const part of raw.split(';')) {
    const segment = part.trim()
    const i = segment.indexOf('=')
    if (i === -1) continue
    const key = segment.slice(0, i).trim()
    if (key !== name) continue
    try {
      return decodeURIComponent(segment.slice(i + 1).trim())
    } catch {
      return segment.slice(i + 1).trim()
    }
  }
  return ''
}

/** JWT claims (tutorial-style: who this session is). DB remains source of truth for `/profile`. */
function signAuthToken(userDoc) {
  const secret = jwtSecret()
  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES
  return jwt.sign(
    {
      sub: String(userDoc._id),
      email: userDoc.email,
      name: userDoc.name ?? '',
      role: userDoc.role ?? 'owner',
    },
    secret,
    { expiresIn },
  )
}

/** Same public shape for login, register success, and `/profile` (never raw `userDoc`). */
function jsonUserSession(userDoc) {
  return { ok: true, user: publicUser(userDoc) }
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  })
}

function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === 'production'
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  })
}

/** Current user doc from JWT cookie, or `null` if missing / invalid / user gone. */
async function userFromAuthCookie(req) {
  const token = readCookie(req, AUTH_COOKIE_NAME)
  if (!token) return null
  const secret = jwtSecret()
  if (!secret) return null
  let payload
  try {
    payload = jwt.verify(token, secret)
  } catch {
    return null
  }
  const id = payload?.sub
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) return null
  return User.findById(id)
}

function readRegisterBody(body = {}) {
  return {
    name: String(body.name ?? body.fullName ?? '').trim(),
    email: String(body.email ?? '').trim(),
    password: String(body.password ?? '').trim(),
  }
}

function readLoginBody(body = {}) {
  return {
    email: String(body.email ?? '').trim(),
    password: String(body.password ?? ''),
  }
}

function publicUser(doc) {
  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    firstName: doc.firstName ?? '',
    lastName: doc.lastName ?? '',
    phone: doc.phone ?? '',
    country: doc.country ?? '',
    city: doc.city ?? '',
    address: doc.address ?? '',
    avatar: doc.avatar ?? '',
    plan: doc.plan ?? 'free',
    role: doc.role ?? 'owner',
  }
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

function queueWelcomeEmail(userDoc, role) {
  const email = String(userDoc?.email || '').trim()
  if (!email) return
  const display = userDoc?.name || userDoc?.firstName || 'cher utilisateur'
  if (role === 'professional') {
    sendMail({
      to: email,
      subject: 'Bienvenue sur GaliPet 🐾 — Professionnel',
      html: templates.welcomePro({ name: display }),
    })
    return
  }
  sendMail({
    to: email,
    subject: 'Bienvenue sur GaliPet 🐾',
    html: templates.welcomeOwner({ name: display }),
  })
}

const degreesDir = path.join(__dirname, '..', 'uploads', 'degrees')
fs.mkdirSync(degreesDir, { recursive: true })

const degreeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, degreesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const safe = ['.pdf', '.jpg', '.jpeg', '.png'].includes(ext) ? ext : ''
    cb(null, `degree-${Date.now()}-${Math.round(Math.random() * 1e9)}${safe || '.bin'}`)
  },
})

const uploadDegree = multer({
  storage: degreeStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const okMime = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype)
    const okName = /\.(pdf|jpe?g|png)$/i.test(file.originalname || '')
    if (okMime || okName) return cb(null, true)
    return cb(new Error('Only PDF, JPG or PNG files are allowed'))
  },
})

const PRO_SPECIALTIES = new Set(['vet', 'grooming', 'sitting', 'training'])

/** Runs multer only for multipart so JSON POST /register (legacy owner JSON) still works. */
function registerUploadMaybe(req, res, next) {
  const ct = String(req.headers['content-type'] || '').toLowerCase()
  if (ct.includes('multipart/form-data')) {
    return uploadDegree.single('degree')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'upload failed' })
      }
      return next()
    })
  }
  return next()
}

router.get('/register', (req, res) => {
  res.redirect(302, `${webAppOrigin()}/register`)
})

router.get('/login', (req, res) => {
  res.redirect(302, `${webAppOrigin()}/login`)
})

// Do not replace registerUploadMaybe with uploadDegree.single('degree') alone — JSON registrations must skip multer.
router.post('/register', registerUploadMaybe, async (req, res) => {
  if (process.env.GALIPET_DEBUG_REGISTER === '1') {
    console.log('REGISTER BODY:', req.body)
    console.log('REGISTER FILE:', req.file)
    console.log('REGISTER CONTENT-TYPE:', req.headers['content-type'])
  }

  const ct = String(req.headers['content-type'] || '').toLowerCase()

  if (!ct.includes('multipart/form-data')) {
    const { name, email, password } = readRegisterBody(req.body)
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }
    try {
      const userDoc = await User.create({
        name,
        email,
        password: await hashPassword(password),
      })
      let token
      try {
        token = signAuthToken(userDoc)
      } catch (secretErr) {
        console.error('[auth/register]', secretErr.message)
        return res.status(500).json({
          error: /JWT_SECRET/i.test(secretErr.message)
            ? 'Server missing JWT_SECRET add it to api/.env and restart the API'
            : 'registration temporarily unavailable',
        })
      }
      setAuthCookie(res, token)
      queueWelcomeEmail(userDoc, 'owner')
      return res.status(201).json(jsonUserSession(userDoc))
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'email already registered' })
      }
      return res.status(400).json({ error: err.message || 'registration failed' })
    }
  }

  const b = req.body || {}
  const firstName = String(b.firstName ?? '').trim()
  const lastName = String(b.lastName ?? '').trim()
  const email = String(b.email ?? '').trim().toLowerCase()
  const password = String(b.password ?? '')
  const confirmPassword = String(b.confirmPassword ?? '')
  const city = String(b.city ?? '').trim()
  const country = String(b.country ?? '').trim()
  const validRoles = ['owner', 'professional']
  const userRole = String(b.role ?? 'owner').toLowerCase()
  if (!validRoles.includes(userRole)) {
    return res.status(400).json({ error: 'invalid role' })
  }

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'first name and last name are required' })
  }
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' })
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'passwords do not match' })
  }
  if (!city) {
    return res.status(400).json({ error: 'city is required' })
  }

  const name = `${firstName} ${lastName}`.trim()
  const specialty = String(b.specialty ?? '').trim()
  const phone = String(b.phone ?? '').trim()
  const location = String(b.location ?? '').trim()
  const description = String(b.description ?? '').trim()
  const experience = Math.min(50, Math.max(0, Number.parseInt(String(b.experience ?? '0'), 10) || 0))
  const licenseNumber = String(b.licenseNumber ?? '').trim()

  if (userRole === 'professional') {
    if (!PRO_SPECIALTIES.has(specialty)) {
      return res.status(400).json({ error: 'valid specialty is required for professionals' })
    }
    if (!phone || !location || !description) {
      return res.status(400).json({ error: 'phone, location, and description are required for professionals' })
    }
  }

  const degreeUrl = req.file ? `/uploads/degrees/${req.file.filename}` : ''

  let userDoc
  try {
    userDoc = await User.create({
      name,
      firstName,
      lastName,
      email,
      password: await hashPassword(password),
      role: userRole,
      city,
      phone: userRole === 'professional' ? phone : '',
    })
  } catch (err) {
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path)
      } catch {
        /* ignore */
      }
    }
    if (err.code === 11000) {
      return res.status(409).json({ error: 'email already registered' })
    }
    return res.status(400).json({ error: err.message || 'registration failed' })
  }

  if (userRole === 'professional') {
    try {
      const newPro = await Professional.create({
        name,
        specialty,
        city,
        location,
        phone,
        description,
        rating: 0,
        userId: userDoc._id,
        licenseNumber,
        experience,
        degreeUrl,
        isVerified: false,
        verificationStatus: 'pending',
      })
      await geocodeAndUpdateProfessional(newPro._id, location, city, country)
    } catch (err) {
      await User.deleteOne({ _id: userDoc._id })
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path)
        } catch {
          /* ignore */
        }
      }
      return res.status(400).json({ error: err.message || 'could not create professional profile' })
    }
  }

  let token
  try {
    token = signAuthToken(userDoc)
  } catch (secretErr) {
    await User.deleteOne({ _id: userDoc._id })
    if (userRole === 'professional') {
      await Professional.deleteOne({ userId: userDoc._id })
    }
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path)
      } catch {
        /* ignore */
      }
    }
    console.error('[auth/register]', secretErr.message)
    return res.status(500).json({
      error: /JWT_SECRET/i.test(secretErr.message)
        ? 'Server missing JWT_SECRET add it to api/.env and restart the API'
        : 'registration temporarily unavailable',
    })
  }

  setAuthCookie(res, token)
  queueWelcomeEmail(userDoc, userRole)
  return res.status(201).json(jsonUserSession(userDoc))
})

router.post('/login', async (req, res) => {
  const { email, password } = readLoginBody(req.body)
  if (!email || !password.trim()) {
    return res.status(400).json({ error: 'email and password are required' })
  }
  try {
    const userDoc = await User.findOne({ email })
    if (!userDoc) {
      return res.status(401).json({ error: 'no account for this email' })
    }
    const passOk = await bcrypt.compare(password, userDoc.password)
    if (!passOk) {
      return res.status(401).json({ error: 'password not valid' })
    }

    let token
    try {
      token = signAuthToken(userDoc)
    } catch (secretErr) {
      console.error('[auth/login]', secretErr.message)
      const missingSecret = /JWT_SECRET/i.test(secretErr.message)
      return res.status(500).json({
        error: missingSecret
          ? 'Server missing JWT_SECRET add it to api/.env and restart the API'
          : 'login temporarily unavailable',
      })
    }
    setAuthCookie(res, token)
    // Cookie holds JWT; body is safe public fields only (not `res.json(userDoc)`).
    return res.json(jsonUserSession(userDoc))
  } catch (err) {
    return res.status(500).json({ error: err.message || 'login failed' })
  }
})

router.get('/profile', async (req, res) => {
  if (!jwtSecret()) {
    return res.status(500).json({ error: 'server misconfiguration' })
  }
  try {
    const userDoc = await userFromAuthCookie(req)
    if (!userDoc) {
      return res.status(401).json({ error: 'not authenticated' })
    }
    return res.json(jsonUserSession(userDoc))
  } catch (err) {
    return res.status(500).json({ error: err.message || 'profile failed' })
  }
})

router.post('/logout', (req, res) => {
  clearAuthCookie(res)
  return res.json({ ok: true })
})

module.exports = router
