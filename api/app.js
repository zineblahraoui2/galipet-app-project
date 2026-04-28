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

const app = express()

const corsOrigin =
  process.env.NODE_ENV === 'production'
    ? /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
    : true

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
)
app.use(stripeWebhookRouter)
app.use(express.json())
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
