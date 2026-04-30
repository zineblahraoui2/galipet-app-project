const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const { connectDb } = require('../db')
const Professional = require('../models/professionals')

/** Seed uses `specialty` (vet | grooming | sitting | training) — matches API + Search filters. */
const professionals = [
  {
    name: 'Dr. Benali Youssef',
    specialty: 'vet',
    location: 'Fes Medina',
    city: 'Fes',
    lat: 34.0181,
    lng: -5.0078,
    rating: 4.9,
    phone: '+212 600-000-001',
    description: 'Small-animal care with evening appointments.',
    avatar: '',
    services: [
      { name: 'Consultation', price: 200, duration: 30, description: 'General check-up' },
      { name: 'Vaccination', price: 150, duration: 15, description: 'Routine vaccination' },
    ],
  },
  {
    name: 'Salon Pets Fes',
    specialty: 'grooming',
    location: 'Ville Nouvelle',
    city: 'Fes',
    lat: 34.02,
    lng: -5.01,
    rating: 4.8,
    phone: '+212 600-000-003',
    description: 'Full grooming and nail care for cats and dogs.',
    avatar: '',
    services: [
      { name: 'Full Grooming', price: 250, duration: 90, description: 'Complete grooming service' },
      { name: 'Nail Trim', price: 50, duration: 15, description: 'Nail trimming only' },
    ],
  },
  {
    name: 'Karim Walker',
    specialty: 'sitting',
    location: 'Fes',
    city: 'Fes',
    lat: 34.015,
    lng: -5.005,
    rating: 4.7,
    phone: '+212 600-000-004',
    description: 'Reliable home visits and dog walking.',
    avatar: '',
    services: [
      { name: 'Dog Walking', price: 100, duration: 60, description: '1 hour walk' },
      { name: 'Pet Sitting', price: 300, duration: 480, description: 'Overnight stay' },
    ],
  },
  {
    name: 'Sofia Trainer',
    specialty: 'training',
    location: 'Maarif',
    city: 'Casablanca',
    lat: 33.5731,
    lng: -7.5898,
    rating: 4.8,
    phone: '+212 600-000-005',
    description: 'Obedience and leash training for dogs.',
    avatar: '',
    services: [
      { name: 'Obedience Training', price: 400, duration: 60, description: 'Basic obedience' },
      { name: 'Leash Training', price: 200, duration: 30, description: 'Leash walking' },
    ],
  },
  {
    name: 'Dr. Amina',
    specialty: 'vet',
    location: 'Hassan',
    city: 'Rabat',
    lat: 34.0209,
    lng: -6.8416,
    rating: 4.85,
    phone: '+212 600-000-006',
    description: 'Cats, dogs, and preventive medicine.',
    avatar: '',
    services: [
      { name: 'Consultation', price: 180, duration: 30, description: 'Vet consultation' },
      { name: 'Vaccination', price: 120, duration: 15, description: 'Vaccination' },
    ],
  },
  {
    name: 'Nadia Groomer',
    specialty: 'grooming',
    location: 'Gueliz',
    city: 'Marrakech',
    lat: 31.6295,
    lng: -7.9811,
    rating: 4.75,
    phone: '+212 600-000-007',
    description: 'Breed cuts and spa grooming.',
    avatar: '',
    services: [
      { name: 'Breed Cut', price: 300, duration: 120, description: 'Breed-specific cut' },
      { name: 'Spa Grooming', price: 400, duration: 150, description: 'Full spa treatment' },
    ],
  },
  {
    name: 'Youssef Sitter',
    specialty: 'sitting',
    location: 'Ain Diab',
    city: 'Casablanca',
    lat: 33.59,
    lng: -7.61,
    rating: 4.65,
    phone: '+212 600-000-008',
    description: 'Overnight stays and daily dog walks.',
    avatar: '',
    services: [
      { name: 'Overnight Stay', price: 250, duration: 720, description: 'Overnight pet sitting' },
      { name: 'Daily Walk', price: 80, duration: 60, description: 'Daily walk' },
    ],
  },
  {
    name: 'Atlas Trainer',
    specialty: 'training',
    location: 'Agdal',
    city: 'Rabat',
    lat: 34.01,
    lng: -6.83,
    rating: 4.9,
    phone: '+212 600-000-009',
    description: 'Behavior modification and puppy basics.',
    avatar: '',
    services: [
      { name: 'Behavior Modification', price: 500, duration: 90, description: 'Behavior training' },
      { name: 'Puppy Basics', price: 300, duration: 60, description: 'Puppy training' },
    ],
  },
]

async function main() {
  await connectDb()
  await Professional.deleteMany({})
  await Professional.insertMany(professionals)
  console.log('Seeded', professionals.length, 'professionals.')
  const missing = await Professional.countDocuments({
    $or: [{ lat: { $exists: false } }, { lng: { $exists: false } }, { lat: null }, { lng: null }],
  })
  if (missing > 0) {
    console.warn('Warning:', missing, 'documents missing lat/lng.')
  } else {
    console.log('Verified: all seeded professionals have lat and lng.')
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
