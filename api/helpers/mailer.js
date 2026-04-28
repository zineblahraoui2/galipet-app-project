const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: String(process.env.MAIL_USER || '').trim(),
    pass: String(process.env.MAIL_PASS || '').trim(),
  },
})

async function sendMail({ to, subject, html }) {
  try {
    const user = String(process.env.MAIL_USER || '').trim()
    const pass = String(process.env.MAIL_PASS || '').trim()
    if (!to || !subject || !html || !user || !pass) return
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
    })
    console.log(`[mailer] sent "${subject}" to ${to}`)
  } catch (err) {
    console.error('[mailer] failed:', err.message)
  }
}

module.exports = { sendMail }
