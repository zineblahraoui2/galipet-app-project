const { sendMail } = require('./mailer')

function wrap(content) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;padding:20px;color:#1a1a1a;">
    <h2 style="margin:0 0 10px;color:#E05C2A;">GaliPet</h2>
    ${content}
  </div>
  `
}

async function sendPaymentSuccessEmail({ to, plan, amountMad }) {
  if (!to) return
  await sendMail({
    to,
    subject: `Subscription active — ${String(plan || '').toUpperCase()}`,
    html: wrap(`
      <p style="margin:0 0 12px;">Your subscription is now active.</p>
      <p style="margin:0 0 6px;"><strong>Plan:</strong> ${String(plan || '').toUpperCase()}</p>
      <p style="margin:0 0 16px;"><strong>Amount:</strong> ${Number(amountMad) || 0} MAD / month</p>
      <p style="margin:0;">Thank you for upgrading your GaliPet experience.</p>
    `),
  })
}

async function sendPaymentFailedEmail({ to, plan }) {
  if (!to) return
  await sendMail({
    to,
    subject: 'Payment failed — action needed',
    html: wrap(`
      <p style="margin:0 0 12px;">We could not process your last subscription payment.</p>
      <p style="margin:0 0 12px;"><strong>Plan:</strong> ${String(plan || '').toUpperCase() || 'Subscription'}</p>
      <p style="margin:0;">Please update your payment method to avoid interruption.</p>
    `),
  })
}

module.exports = {
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
}
