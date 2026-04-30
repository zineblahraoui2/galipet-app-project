const fs = require('fs')
const path = require('path')

// Always load api/.env regardless of where you start the process (cwd).
require('dotenv').config({ path: path.join(__dirname, '.env') })
// Dev: Mapbox token often lives in galipet-app/.env as VITE_MAPBOX_TOKEN only.
const galipetEnv = path.join(__dirname, '..', 'galipet-app', '.env')
if (fs.existsSync(galipetEnv)) {
  require('dotenv').config({ path: galipetEnv, override: false })
}

const { connectDb } = require('./db')
const app = require('./app')

// Connect to DB
connectDb().catch((err) => {
  console.error('MongoDB connection error:', err.message)
  process.exit(1)
})

// Export app for Vercel serverless
module.exports = app

// For local development
if (require.main === module) {
  const autoCompleteBookings = require('./helpers/autoCompleteBookings')
  const { startReminderJob } = require('./helpers/reminderJob')

  const port = Number(process.env.PORT) || 3001

  console.log('[galipet-api] process.cwd():', process.cwd())
  console.log('[galipet-api] app entry:', path.join(__dirname, 'app.js'))
  console.log(
    '[galipet-api] JWT_SECRET:',
    process.env.JWT_SECRET?.trim() ? 'set' : 'MISSING (POST /login will fail)',
  )

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`)
    console.log(
      '[galipet-api] Expect POST /register → 201 + body.user.id (otherwise another app may be using this port).',
    )
  })

  const AUTOCOMPLETE_MS = 5 * 60 * 1000
  setInterval(() => {
    autoCompleteBookings().catch((err) => console.error('[autoCompleteBookings]', err.message))
  }, AUTOCOMPLETE_MS)
  autoCompleteBookings().catch((err) => console.error('[autoCompleteBookings]', err.message))
  startReminderJob()
}