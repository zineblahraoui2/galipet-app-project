const mongoose = require('mongoose')

/**
 * @returns {Promise<void>}
 */
async function connectDb() {
  const uri = (process.env.MONGO_URL || process.env.MONGODB_URI || '').trim()
  if (!uri) {
    throw new Error('Set MONGO_URL or MONGODB_URI in api/.env (e.g. mongodb://127.0.0.1:27017/galipet)')
  }
  await mongoose.connect(uri)
  const { host, name } = mongoose.connection
  console.log('MongoDB connected:', { host, database: name })
}

module.exports = { connectDb }
