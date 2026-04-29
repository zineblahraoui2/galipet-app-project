const cors = require('cors')
const express = require('express')
const path = require('path')
const authRoutes = require('./routes/auth')
const metaRoutes = require('./routes/meta')
const usersRoutes = require('./routes/users')
const petsRoutes = require('./routes/pets')
const activityRoutes = require('./routes/activity')
const bookingsRoutes = require('./routes/bookings')
const professionalsRoutes = require('./routes/professionals')
const proRoutes = require('./routes/pro')
const messagesRoutes = require('./routes/messages')
const reviewsRoutes = require('./routes/reviews')
const { stripeApiRouter, stripeWebhookRouter } = require('./routes/stripe')
const adminRoutes = require('./routes/admin')
const passport = require('./middleware/passport')

const app = express()

/** Production: allow your real frontend origin(s). Comma-separated. Example: https://app.example.com */
function productionCorsOrigin() {
  const raw = String(process.env.CLIENT_URL || process.env.CORS_ORIGIN || process.env.WEB_APP_URL || '').trim()
  if (raw) {
    const list = raw.split(',').map((s) => s.trim()).filter(Boolean)
    return list.length === 1 ? list[0] : list
  }
  console.warn(
    '[galipet-api] CLIENT_URL not set in production — only localhost is allowed. Set CLIENT_URL to your app URL (e.g. https://your-app.vercel.app).',
  )
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
}

const corsOrigin = process.env.NODE_ENV === 'production' ? productionCorsOrigin() : true

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
)
app.use(stripeWebhookRouter)
app.use(express.json())
app.use(passport.initialize())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use(metaRoutes)
app.use(authRoutes)
app.use(usersRoutes)
app.use(petsRoutes)
app.use(activityRoutes)
app.use(bookingsRoutes)
app.use(proRoutes)
app.use(professionalsRoutes)
app.use(messagesRoutes)
app.use(reviewsRoutes)
app.use(stripeApiRouter)
app.use(adminRoutes)

module.exports = app
