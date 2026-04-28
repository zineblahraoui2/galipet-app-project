const express = require('express')
const mongoose = require('mongoose')

const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    name: 'galipet-api',
    message: 'API is running',
    try: '/health',
    registerWritesMongo: true,
  })
})

router.get('/health', (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1
  res.json({
    ok: true,
    mongo: mongoConnected ? 'connected' : 'disconnected',
    mongoReadyState: mongoose.connection.readyState,
  })
})

module.exports = router
