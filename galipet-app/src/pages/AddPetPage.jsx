import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

const TOTAL_STEPS = 2
const FIELD_CLASS =
  'mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/20'

function emptyAddPetFormData() {
  return {
    name: '',
    species: 'dog',
    breed: '',
    dateOfBirth: '',
    gender: '',
    color: '',
    weight: '',
    microchip: '',
    neutered: 'false',
    usualVet: '',
    allergies: '',
  }
}

export default function AddPetPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState(emptyAddPetFormData())

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handleNextStep() {
    if (!formData.name.trim() || !formData.species) {
      setError('Please fill pet name and species before continuing.')
      return
    }
    setError('')
    setStep(2)
  }

  function handleCancel() {
    navigate('/account/pets')
  }

  async function handleSubmit() {
    setBusy(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const payload = {
        ...formData,
        weight: formData.weight ? Number(formData.weight) : null,
        neutered: formData.neutered === 'true' || formData.neutered === true,
      }

      const res = await fetch(`${api.defaults.baseURL}/api/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error('Failed to add pet')
      }

      navigate('/account/pets', {
        replace: true,
        state: { toast: 'Pet added successfully!' },
      })
    } catch (e) {
      setError(e?.message ?? 'Failed to add pet.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <h2 className="text-lg font-semibold text-gray-900">Add a pet</h2>
      <p className="mt-1 text-sm font-medium text-[#D85A30]">
        Step {step} of {TOTAL_STEPS}
      </p>

      <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        {step === 1 ? (
          <section className="rounded-xl border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-900">Basic info</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tell us who your pet is.
            </p>
            <div className="mt-4 grid gap-3">
              <label className="block text-sm text-gray-700">
                Pet name <span className="text-red-500">*</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Pet name"
                  value={formData.name}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                />
              </label>
              <label className="block text-sm text-gray-700">
                Species <span className="text-red-500">*</span>
                <select
                  name="species"
                  value={formData.species}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                </select>
              </label>
              <label className="block text-sm text-gray-700">
                Breed
                <input
                  type="text"
                  name="breed"
                  placeholder="Breed"
                  value={formData.breed}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Date of birth
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={FIELD_CLASS}
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Gender
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={FIELD_CLASS}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm text-gray-700">
                Color / markings
                <input
                  type="text"
                  name="color"
                  placeholder="e.g. Golden, Black & White"
                  value={formData.color}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                />
              </label>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-900">Health info</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add useful medical details for better care.
            </p>
            <div className="mt-4 grid gap-3">
              <div className="block text-sm text-gray-700">
                <label htmlFor="newPetWeight" className="mb-1 block">
                  Weight in kg
                </label>
                <input
                  id="newPetWeight"
                  type="number"
                  name="weight"
                  min="0"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                />
              </div>
              <label className="block text-sm text-gray-700">
                Microchip number
                <input
                  type="text"
                  name="microchip"
                  value={formData.microchip}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                />
              </label>
              <label className="block text-sm text-gray-700">
                Neutered / Spayed
                <select
                  name="neutered"
                  value={formData.neutered}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <label className="block text-sm text-gray-700">
                Usual vet
                <input
                  type="text"
                  name="usualVet"
                  placeholder="e.g. Dr. Benali"
                  value={formData.usualVet}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                />
              </label>
              <label className="block text-sm text-gray-700">
                Allergies or special notes
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  className={`${FIELD_CLASS} min-h-24`}
                />
              </label>
            </div>
          </section>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="secondary" onClick={handleCancel}>
          Cancel
        </button>
        {step === 1 ? (
          <button type="button" className="primary" onClick={handleNextStep}>
            Next →
          </button>
        ) : (
          <>
            <button type="button" className="secondary" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button
              type="button"
              className="primary"
              onClick={handleSubmit}
              disabled={busy}
            >
              Add pet
            </button>
          </>
        )}
      </div>
    </div>
  )
}
