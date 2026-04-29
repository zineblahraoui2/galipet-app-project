const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/users')

const clientID = String(process.env.GOOGLE_CLIENT_ID || '').trim()
const clientSecret = String(process.env.GOOGLE_CLIENT_SECRET || '').trim()
const callbackURL = String(process.env.GOOGLE_CALLBACK_URL || '').trim()

if (clientID && clientSecret && callbackURL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = String(profile.emails?.[0]?.value || '')
            .trim()
            .toLowerCase()
          if (!email) return done(new Error('No email from Google'), null)

          let user = await User.findOne({ email })

          if (user) {
            if (user.googleId && String(user.googleId) !== String(profile.id)) {
              return done(new Error('This email is linked to another Google account'), null)
            }
            if (!user.googleId) {
              user.googleId = String(profile.id)
              await user.save()
            }
            return done(null, user)
          }

          user = await User.create({
            email,
            googleId: String(profile.id),
            name: String(profile.displayName || email.split('@')[0] || 'Pet owner').trim(),
            firstName: String(profile.name?.givenName || '').trim(),
            lastName: String(profile.name?.familyName || '').trim(),
            avatar: String(profile.photos?.[0]?.value || '').trim(),
            role: 'owner',
            plan: 'free',
            password: null,
          })

          return done(null, user)
        } catch (err) {
          return done(err, null)
        }
      },
    ),
  )
}

module.exports = passport
