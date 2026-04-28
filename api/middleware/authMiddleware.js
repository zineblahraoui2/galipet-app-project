const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const AUTH_COOKIE_NAME = 'token'

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

function readBearerToken(req) {
  const header = String(req.headers?.authorization || '')
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return ''
  return token.trim()
}

function authMiddleware(req, res, next) {
  const secret = jwtSecret()
  if (!secret) {
    return res.status(500).json({ error: 'server misconfiguration' })
  }

  const token = readBearerToken(req) || readCookie(req, AUTH_COOKIE_NAME)
  if (!token) {
    return res.status(401).json({ error: 'not authenticated' })
  }

  let payload
  try {
    payload = jwt.verify(token, secret)
  } catch {
    return res.status(401).json({ error: 'not authenticated' })
  }

  const id = String(payload?.sub ?? '')
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(401).json({ error: 'not authenticated' })
  }

  req.user = { id }
  return next()
}

module.exports = authMiddleware
