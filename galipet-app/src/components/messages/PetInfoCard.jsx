import { useState } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'

export default function PetInfoCard({ petInfo }) {
  const [open, setOpen] = useState(true)
  if (!petInfo?.name) return null
  const agePart =
    petInfo.age != null && !Number.isNaN(Number(petInfo.age))
      ? `${petInfo.age} years old`
      : null
  const parts = [petInfo.name, petInfo.breed || petInfo.species, agePart].filter(Boolean)
  return (
    <div className="border-b border-gray-100 bg-[#F6EFE9]/80 px-4 py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left text-sm text-gray-800"
      >
        <span>
          🐾 {parts.join(' · ')}
        </span>
        {open ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
      </button>
      {open ? (
        <p className="mt-1 text-xs text-gray-500">
          Species: <span className="capitalize">{petInfo.species || '—'}</span>
          {petInfo.breed ? ` · ${petInfo.breed}` : null}
        </p>
      ) : null}
    </div>
  )
}
