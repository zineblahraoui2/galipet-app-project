/**
 * One-off: geocode "Bd Abderrahim Bouabid, Casablanca" and set lat/lng on professional named "Hassan Yacoubi".
 * Run from api/:  node scripts/backfill-hassan-yacoubi-coords.js
 * Requires MAPBOX_TOKEN and MONGO_URL in api/.env
 */
const path = require('path')
const apiRoot = path.join(__dirname, '..')
require('dotenv').config({ path: path.join(apiRoot, '.env') })
// Same Mapbox token as the Vite app (api/.env may only define MONGO_URL).
require('dotenv').config({ path: path.join(apiRoot, '..', 'galipet-app', '.env') })
const mongoose = require('mongoose')
const Professional = require('../models/professionals')

const PLACE = 'Bd Abderrahim Bouabid, Casablanca'
const NAME = 'Hassan Yacoubi'

async function main() {
  const token = String(process.env.MAPBOX_TOKEN || process.env.VITE_MAPBOX_TOKEN || '').trim()
  if (!token) {
    console.error('No Mapbox token: set MAPBOX_TOKEN in api/.env or VITE_MAPBOX_TOKEN in galipet-app/.env')
    process.exit(1)
  }
  const mongoUrl = process.env.MONGO_URL
  if (!mongoUrl) {
    console.error('MONGO_URL is missing')
    process.exit(1)
  }

  await mongoose.connect(mongoUrl)
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(PLACE)}.json` +
      `?access_token=${token}&limit=1&country=ma`
    const geo = await fetch(url)
    if (!geo.ok) {
      console.error('Mapbox HTTP', geo.status)
      process.exit(1)
    }
    const data = await geo.json()
    if (!data.features?.length) {
      console.error('No geocoding results')
      process.exit(1)
    }
    const [lng, lat] = data.features[0].center
    const r = await Professional.updateOne({ name: NAME }, { $set: { lat, lng } })
    console.log('updateOne matched:', r.matchedCount, 'modified:', r.modifiedCount, 'lat', lat, 'lng', lng)
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
