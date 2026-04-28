/**
 * Inserts professionals only when no document with the same `name` exists.
 * Run from repo root: `node api/scripts/insertProfessionalsIfMissing.js`
 * Or from api/: `node scripts/insertProfessionalsIfMissing.js`
 */
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const { connectDb } = require('../db')
const Professional = require('../models/professionals')

const toInsert = [
  {
    name: 'Dr. Benali Youssef',
    specialty: 'vet',
    city: 'Fes',
    rating: 4.9,
    reviewsCount: 32,
    lat: 34.0331,
    lng: -5.0003,
    location: 'Fes',
    phone: '',
    description: '',
    avatar: '',
  },
  {
    name: 'Salon Pets Fes',
    specialty: 'grooming',
    city: 'Fes',
    rating: 4.8,
    reviewsCount: 21,
    lat: 34.0372,
    lng: -4.9915,
    location: 'Fes',
    phone: '',
    description: '',
    avatar: '',
  },
  {
    name: 'Karim Walker',
    specialty: 'sitting',
    city: 'Fes',
    rating: 4.7,
    reviewsCount: 18,
    lat: 34.0285,
    lng: -5.012,
    location: 'Fes',
    phone: '',
    description: '',
    avatar: '',
  },
  {
    name: 'Sara Trainer',
    specialty: 'training',
    city: 'Fes',
    rating: 4.6,
    reviewsCount: 12,
    lat: 34.041,
    lng: -5.0055,
    location: 'Fes',
    phone: '',
    description: '',
    avatar: '',
  },
  {
    name: 'Clinique Vet Rabat',
    specialty: 'vet',
    city: 'Rabat',
    rating: 4.9,
    reviewsCount: 40,
    lat: 34.0209,
    lng: -6.8416,
    location: 'Rabat',
    phone: '',
    description: '',
    avatar: '',
  },
  {
    name: 'Dog Groom Casa',
    specialty: 'grooming',
    city: 'Casablanca',
    rating: 4.7,
    reviewsCount: 27,
    lat: 33.5731,
    lng: -7.5898,
    location: 'Casablanca',
    phone: '',
    description: '',
    avatar: '',
  },
  {
    name: 'Amine Pet Sitter',
    specialty: 'sitting',
    city: 'Casablanca',
    rating: 4.8,
    reviewsCount: 19,
    lat: 33.589,
    lng: -7.603,
    location: 'Casablanca',
    phone: '',
    description: '',
    avatar: '',
  },
  {
    name: 'Marrakech Dog Trainer',
    specialty: 'training',
    city: 'Marrakech',
    rating: 4.6,
    reviewsCount: 15,
    lat: 31.6295,
    lng: -7.9811,
    location: 'Marrakech',
    phone: '',
    description: '',
    avatar: '',
  },
]

async function main() {
  await connectDb()
  let inserted = 0
  let skipped = 0
  for (const doc of toInsert) {
    const name = String(doc.name || '').trim()
    const exists = await Professional.exists({ name })
    if (exists) {
      skipped += 1
      console.log('Skip (exists):', name)
      continue
    }
    await Professional.create(doc)
    inserted += 1
    console.log('Inserted:', name)
  }
  console.log('Done. Inserted:', inserted, 'Skipped:', skipped)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
