const Booking = require('../models/bookings')
const User = require('../models/users')
const Professional = require('../models/professionals')
const { sendMail } = require('./mailer')
const templates = require('./emailTemplates')

async function sendReminders() {
  const now = new Date()
  const tomorrowStart = new Date(now)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  tomorrowStart.setHours(0, 0, 0, 0)

  const tomorrowEnd = new Date(tomorrowStart)
  tomorrowEnd.setHours(23, 59, 59, 999)

  const bookings = await Booking.find({
    status: 'confirmed',
    startAt: { $gte: tomorrowStart, $lte: tomorrowEnd },
    reminderSent: { $ne: true },
  })
    .populate('pet', 'name')
    .lean()

  for (const booking of bookings) {
    try {
      const [ownerUser, proUser, proDoc] = await Promise.all([
        User.findById(booking.owner).select('email name').lean(),
        User.findById(booking.professional?.userId).select('email name').lean(),
        Professional.findOne({ userId: booking.professional?.userId }).select('location').lean(),
      ])

      const dateStr = new Date(booking.startAt).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      if (ownerUser?.email) {
        sendMail({
          to: ownerUser.email,
          subject: `Rappel — votre rendez-vous demain avec ${booking.professional?.name || 'votre professionnel'}`,
          html: templates.reminderOwner({
            ownerName: ownerUser.name || 'cher client',
            proName: booking.professional?.name || 'Professionnel',
            serviceType: booking.serviceName,
            date: dateStr,
            timeSlot: null,
            petName: booking.pet?.name || null,
            proLocation: proDoc?.location || null,
          }),
        })
      }

      if (proUser?.email) {
        sendMail({
          to: proUser.email,
          subject: `Rappel — rendez-vous demain avec ${ownerUser?.name || 'un client'}`,
          html: templates.reminderPro({
            proName: proUser.name || booking.professional?.name || 'Professionnel',
            ownerName: ownerUser?.name || 'un client',
            serviceType: booking.serviceName,
            date: dateStr,
            timeSlot: null,
            petName: booking.pet?.name || null,
          }),
        })
      }

      await Booking.updateOne({ _id: booking._id }, { $set: { reminderSent: true } })
    } catch (err) {
      console.error(`[reminderJob] failed for booking ${booking._id}:`, err.message)
    }
  }

  if (bookings.length > 0) {
    console.log(`[reminderJob] sent reminders for ${bookings.length} bookings`)
  }
}

function startReminderJob() {
  sendReminders().catch((err) => console.error('[reminderJob] initial run failed:', err.message))
  setInterval(() => {
    sendReminders().catch((err) => console.error('[reminderJob] interval run failed:', err.message))
  }, 60 * 60 * 1000)
  console.log('[reminderJob] started — checking every hour')
}

module.exports = { startReminderJob }
