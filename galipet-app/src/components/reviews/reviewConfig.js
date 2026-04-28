/** Tag values must match api/models/Review.js enums */

export const OWNER_REVIEW_TAGS = [
  { value: 'great_with_anxious_pets', label: 'Great with anxious pets' },
  { value: 'handles_large_dogs', label: 'Handles large dogs well' },
  { value: 'very_gentle', label: 'Very gentle' },
  { value: 'explains_clearly', label: 'Explains clearly' },
  { value: 'clean_space', label: 'Clean space' },
  { value: 'on_time', label: 'On time' },
  { value: 'goes_above_and_beyond', label: 'Goes above and beyond' },
  { value: 'would_recommend', label: 'Would recommend' },
]

export const PRO_REVIEW_TAGS = [
  { value: 'punctual', label: 'Punctual' },
  { value: 'clear_instructions', label: 'Clear instructions' },
  { value: 'well_behaved_pet', label: 'Well-behaved pet' },
  { value: 'responsive', label: 'Responsive' },
  { value: 'respectful', label: 'Respectful' },
  { value: 'would_accept_again', label: 'Would accept again' },
]

export const CRITERIA_LABELS = [
  { key: 'expertise', label: 'Expertise' },
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'communication', label: 'Communication' },
  { key: 'value', label: 'Value for money' },
]

export function serviceLabel(type) {
  const m = {
    vet: 'Vet',
    grooming: 'Grooming',
    sitting: 'Pet sitting',
    training: 'Training',
  }
  return m[String(type || '').toLowerCase()] || String(type || 'Service')
}
