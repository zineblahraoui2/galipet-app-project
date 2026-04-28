const User = require('../models/users')

async function adminMiddleware(req, res, next) {
  try {
    const userDoc = await User.findById(req.user.id).select('role').lean()
    if (!userDoc || String(userDoc.role || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Admin only' })
    }
    return next()
  } catch (err) {
    return res.status(500).json({ message: err.message || 'failed to authorize admin' })
  }
}

module.exports = adminMiddleware
