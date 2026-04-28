const express = require('express')
const Activity = require('../models/activity')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/api/activity', authMiddleware, async (req, res) => {
  try {
    const activities = await Activity.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
    return res.json(activities)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'failed to load activity' })
  }
})

module.exports = router
