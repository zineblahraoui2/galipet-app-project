const express = require('express')
const Stripe = require('stripe')
const authMiddleware = require('../middleware/authMiddleware')
const User = require('../models/users')
const { sendPaymentSuccessEmail, sendPaymentFailedEmail } = require('../helpers/sendEmail')

const stripeSecret = String(process.env.STRIPE_SECRET_KEY || '').trim()
const stripe = stripeSecret ? new Stripe(stripeSecret) : null

const PRICE_BY_PLAN = {
  pro: String(process.env.STRIPE_PRICE_PRO || '').trim(),
  premium: String(process.env.STRIPE_PRICE_PREMIUM || '').trim(),
}

const AMOUNT_BY_PLAN = {
  pro: 99,
  premium: 199,
}

const webhookRouter = express.Router()
const apiRouter = express.Router()

apiRouter.post('/api/stripe/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured' })
    }
    const plan = String(req.body?.plan || '').toLowerCase()
    if (!['pro', 'premium'].includes(plan)) {
      return res.status(400).json({ error: 'invalid plan' })
    }
    const priceId = PRICE_BY_PLAN[plan]
    if (!priceId) {
      return res.status(400).json({ error: `missing Stripe price id for ${plan}` })
    }

    const userDoc = await User.findById(req.user.id).select('email firstName lastName').lean()
    if (!userDoc) return res.status(404).json({ error: 'user not found' })

    const clientUrl = String(process.env.CLIENT_URL || process.env.WEB_APP_URL || 'http://localhost:5173')

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${clientUrl}/account/subscription?success=true`,
      cancel_url: `${clientUrl}/account/subscription?canceled=true`,
      customer_email: userDoc.email || undefined,
      metadata: {
        userId: String(userDoc._id),
        plan,
      },
    })

    return res.json({ ok: true, url: session.url })
  } catch (err) {
    return res.status(400).json({ error: err.message || 'failed to create checkout session' })
  }
})

webhookRouter.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured' })
    }
    const signature = req.headers['stripe-signature']
    const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim()
    if (!webhookSecret) return res.status(500).send('Webhook secret missing')
    if (!signature) return res.status(400).send('Missing Stripe signature')

    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = String(session?.metadata?.userId || '').trim()
      const plan = String(session?.metadata?.plan || 'free').toLowerCase()
      const customerId = String(session?.customer || '').trim()
      const subscriptionId = String(session?.subscription || '').trim()
      const email = String(session?.customer_details?.email || '').trim()
      let userDoc = null
      if (userId) {
        userDoc = await User.findById(userId)
      }
      if (!userDoc && email) {
        userDoc = await User.findOne({ email: email.toLowerCase() })
      }
      if (userDoc) {
        userDoc.plan = ['pro', 'premium'].includes(plan) ? plan : 'free'
        userDoc.subscription = {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status: 'active',
        }
        await userDoc.save()
        await sendPaymentSuccessEmail({
          to: userDoc.email,
          plan: userDoc.plan,
          amountMad: AMOUNT_BY_PLAN[userDoc.plan] || 0,
        })
      }
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object
      const customerId = String(invoice?.customer || '').trim()
      if (customerId) {
        const userDoc = await User.findOne({ 'subscription.stripeCustomerId': customerId })
        if (userDoc) {
          userDoc.subscription = {
            ...(userDoc.subscription || {}),
            status: 'past_due',
            stripeCustomerId: customerId,
            stripeSubscriptionId:
              String(invoice?.subscription || userDoc.subscription?.stripeSubscriptionId || ''),
          }
          await userDoc.save()
          await sendPaymentFailedEmail({
            to: userDoc.email,
            plan: userDoc.plan || 'subscription',
          })
        }
      }
    }

    return res.json({ received: true })
  } catch (err) {
    return res.status(500).send(err.message || 'webhook failed')
  }
})

module.exports = {
  stripeApiRouter: apiRouter,
  stripeWebhookRouter: webhookRouter,
}
