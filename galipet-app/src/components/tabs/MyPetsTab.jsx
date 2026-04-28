import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaCat, FaDog } from 'react-icons/fa'
import { api } from '../../api/client.js'

const BRAND = '#E05C2A'
const FORM_INPUT_CLASS =
  'mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2 box-border'
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function toInputDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function ageLabel(dateOfBirth) {
  if (!dateOfBirth) return '—'
  const birth = new Date(dateOfBirth)
  if (Number.isNaN(birth.getTime())) return '—'
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years -= 1
  return years < 0 ? '—' : `${years}y`
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

function petEmoji(species) {
  return species === 'cat' ? <FaCat size={20} /> : <FaDog size={20} />
}

function statusClasses(status) {
  if (status === 'expired') return 'bg-red-100 text-red-700'
  if (status === 'due') return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

function statusText(status) {
  if (status === 'expired') return 'Expired'
  if (status === 'due') return 'Due soon'
  return 'Up to date'
}

function emptyPetForm() {
  return {
    name: '',
    species: 'dog',
    breed: '',
    dateOfBirth: '',
    gender: '',
    weight: '',
    color: '',
    microchip: '',
    neutered: 'false',
    usualVet: '',
    allergies: '',
    photo: '',
    vaccines: [],
    documents: [],
    vetHistory: [],
    vaccinationStatus: 'ok',
  }
}

export default function MyPetsTab() {
  const location = useLocation()
  const navigate = useNavigate()
  const [pets, setPets] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [activeSubTab, setActiveSubTab] = useState('info')
  const [form, setForm] = useState(emptyPetForm())
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [vaccineDraft, setVaccineDraft] = useState({
    name: '',
    givenDate: todayInputValue(),
    nextDate: '',
  })
  const [vetDraft, setVetDraft] = useState({
    title: '',
    proName: '',
    date: todayInputValue(),
    notes: '',
  })

  const selectedPet = useMemo(
    () => pets.find((pet) => String(pet._id) === String(selectedId)) ?? null,
    [pets, selectedId],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/api/pets')
        if (cancelled) return
        const list = data?.pets ?? []
        setPets(list)
        if (list[0]?._id) setSelectedId(String(list[0]._id))
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.error ?? 'Failed to load pets.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedPet) {
      setForm(emptyPetForm())
      return
    }
    setForm({
      name: selectedPet.name ?? '',
      species: selectedPet.species ?? 'dog',
      breed: selectedPet.breed ?? '',
      dateOfBirth: toInputDate(selectedPet.dateOfBirth),
      gender: selectedPet.gender ?? '',
      weight:
        selectedPet.weight === 0 || selectedPet.weight
          ? String(selectedPet.weight)
          : '',
      color: selectedPet.color ?? '',
      microchip: selectedPet.microchip ?? '',
      neutered: selectedPet.neutered ? 'true' : 'false',
      usualVet: selectedPet.usualVet ?? '',
      allergies: selectedPet.allergies ?? '',
      photo: selectedPet.photo ?? '',
      vaccines: selectedPet.vaccines ?? [],
      documents: selectedPet.documents ?? [],
      vetHistory: selectedPet.vetHistory ?? [],
      vaccinationStatus: selectedPet.vaccinationStatus ?? 'ok',
    })
  }, [selectedPet])

  function flashToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  useEffect(() => {
    const toastMessage = location.state?.toast
    if (!toastMessage) return
    flashToast(toastMessage)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  function updatePetInList(pet) {
    setPets((prev) =>
      prev.map((item) => (String(item._id) === String(pet._id) ? pet : item)),
    )
  }

  function photoSrc(photo) {
    if (!photo) return ''
    if (/^https?:\/\//i.test(photo)) return photo
    return `${api.defaults.baseURL}${photo}`
  }

  async function saveInfo() {
    if (!selectedPet) return
    setBusy(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        species: form.species,
        breed: form.breed,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        weight: form.weight === '' ? null : Number(form.weight),
        color: form.color,
        microchip: form.microchip,
        neutered: form.neutered === 'true',
        usualVet: form.usualVet,
        allergies: form.allergies,
      }
      const { data } = await api.patch(`/api/pets/${selectedPet._id}`, payload)
      const pet = data?.pet
      if (pet?._id) {
        updatePetInList(pet)
        flashToast('Pet updated successfully.')
      }
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to save pet information.')
    } finally {
      setBusy(false)
    }
  }


  async function removePet() {
    if (!selectedPet) return
    const ok = window.confirm('Remove this pet? This cannot be undone.')
    if (!ok) return
    setBusy(true)
    setError('')
    try {
      await api.delete(`/api/pets/${selectedPet._id}`)
      const remaining = pets.filter(
        (item) => String(item._id) !== String(selectedPet._id),
      )
      setPets(remaining)
      setSelectedId(remaining[0]?._id ? String(remaining[0]._id) : '')
      flashToast('Pet removed.')
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to remove pet.')
    } finally {
      setBusy(false)
    }
  }

  async function uploadPhoto(file) {
    if (!selectedPet || !file) return
    setPhotoUploading(true)
    setError('')
    try {
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Cloudinary config missing in frontend env.')
      }
      const cloudinaryBody = new FormData()
      cloudinaryBody.append('file', file)
      cloudinaryBody.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: cloudinaryBody,
        },
      )
      if (!cloudinaryRes.ok) {
        throw new Error('Failed to upload photo to Cloudinary.')
      }
      const cloudinaryJson = await cloudinaryRes.json()
      const imageUrl = cloudinaryJson?.secure_url
      if (!imageUrl) {
        throw new Error('Cloudinary did not return a photo URL.')
      }

      const { data } = await api.patch(`/api/pets/${selectedPet._id}`, {
        photo: imageUrl,
      })
      if (!data?.pet?._id) {
        throw new Error('Failed to save photo to pet profile.')
      }
      updatePetInList(data.pet)
      flashToast('Photo updated.')
    } catch (e) {
      setError(e?.response?.data?.error ?? e?.message ?? 'Failed to upload photo.')
    } finally {
      setPhotoUploading(false)
    }
  }

  async function addVaccine() {
    if (!selectedPet) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post(`/api/pets/${selectedPet._id}/vaccines`, {
        name: vaccineDraft.name,
        givenDate: vaccineDraft.givenDate || null,
        nextDate: vaccineDraft.nextDate || null,
      })
      if (data?.pet?._id) {
        updatePetInList(data.pet)
        setVaccineDraft({ name: '', givenDate: todayInputValue(), nextDate: '' })
        flashToast('Vaccine added.')
      }
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to add vaccine.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteVaccine(vaccineId) {
    if (!selectedPet) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.delete(
        `/api/pets/${selectedPet._id}/vaccines/${vaccineId}`,
      )
      if (data?.pet?._id) {
        updatePetInList(data.pet)
        flashToast('Vaccine removed.')
      }
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to remove vaccine.')
    } finally {
      setBusy(false)
    }
  }

  async function saveVetHistory(nextHistory) {
    if (!selectedPet) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.patch(`/api/pets/${selectedPet._id}`, {
        vetHistory: nextHistory,
      })
      if (data?.pet?._id) {
        updatePetInList(data.pet)
      }
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to save vet history.')
      throw e
    } finally {
      setBusy(false)
    }
  }

  async function addVetEntry() {
    if (!selectedPet) return
    const nextVetHistory = [
      ...(form.vetHistory ?? []),
      {
        title: vetDraft.title,
        proName: vetDraft.proName,
        date: vetDraft.date || todayInputValue(),
        notes: vetDraft.notes,
        source: 'manual',
      },
    ]
    await saveVetHistory(nextVetHistory)
    setVetDraft({ title: '', proName: '', date: todayInputValue(), notes: '' })
    flashToast('Vet entry added.')
  }

  async function uploadDocument(file) {
    if (!selectedPet || !file) return
    const body = new FormData()
    body.append('document', file)
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post(
        `/api/pets/${selectedPet._id}/documents`,
        body,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      if (data?.pet?._id) {
        updatePetInList(data.pet)
        flashToast('Document uploaded.')
      }
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to upload document.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteDocument(docId) {
    if (!selectedPet) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.delete(`/api/pets/${selectedPet._id}/documents/${docId}`)
      if (data?.pet?._id) {
        updatePetInList(data.pet)
        flashToast('Document removed.')
      }
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to remove document.')
    } finally {
      setBusy(false)
    }
  }

  const vaccineStats = useMemo(() => {
    const rows = form.vaccines ?? []
    return {
      total: rows.length,
      ok: rows.filter((r) => r.status === 'ok').length,
      due: rows.filter((r) => r.status === 'due').length,
      expired: rows.filter((r) => r.status === 'expired').length,
    }
  }, [form.vaccines])

  const vetStats = useMemo(() => {
    const rows = form.vetHistory ?? []
    const now = new Date()
    const thisYear = now.getFullYear()
    return {
      total: rows.length,
      thisYear: rows.filter((v) => new Date(v.date).getFullYear() === thisYear)
        .length,
      upcoming: rows.filter((v) => new Date(v.date) > now).length,
    }
  }, [form.vetHistory])

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-64 rounded-full bg-gray-100" />
          <div className="h-32 rounded-2xl bg-gray-100" />
          <div className="h-56 rounded-2xl bg-gray-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {toast ? (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-3">
        {pets.map((pet) => {
          const active = String(pet._id) === String(selectedId)
          return (
            <button
              key={pet._id}
              type="button"
              onClick={() => setSelectedId(String(pet._id))}
              className={[
                'flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm transition',
                active ? 'border-2' : 'border-[#E05C2A]/35 hover:border-[#E05C2A]/55 hover:bg-[#FEE9DF]/40',
              ].join(' ')}
              style={active ? { borderColor: BRAND } : undefined}
            >
              <span>{petEmoji(pet.species)}</span>
              <span className="font-medium text-gray-800">{pet.name}</span>
            </button>
          )
        })}
        <Link to="/account/pets/new" className="secondary secondary--dashed">
          + Add pet
        </Link>
      </div>

      {!selectedPet ? (
        <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
          No pets yet. Add your first pet to get started.
        </p>
      ) : (
        <>
          <div className="mb-6 rounded-2xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <label
                htmlFor="petPhotoInput"
                className="relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-orange-100 text-3xl"
              >
                {form.photo ? (
                  <img
                    src={photoSrc(form.photo)}
                    alt={`${form.name} photo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{petEmoji(form.species)}</span>
                )}
                {photoUploading ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </span>
                ) : null}
              </label>
              <input
                id="petPhotoInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadPhoto(file)
                  e.target.value = ''
                }}
              />
              <div className="min-w-[12rem]">
                <p className="text-xl font-semibold text-gray-900">{form.name || 'Unnamed pet'}</p>
                <p className="text-sm text-gray-600">
                  {form.breed || 'Unknown breed'} • {form.gender || '—'} • {ageLabel(form.dateOfBirth)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-gray-100 px-3 py-1">{form.species}</span>
              <span
                className={`rounded-full px-3 py-1 ${statusClasses(form.vaccinationStatus)}`}
              >
                Vaccines: {statusText(form.vaccinationStatus)}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {form.neutered === 'true' ? 'Neutered' : 'Not neutered'}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {form.weight ? `${form.weight} kg` : 'Weight —'}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {form.microchip ? `Chip ${form.microchip}` : 'No microchip'}
              </span>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {['info', 'vaccines', 'vet', 'documents'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveSubTab(tab)}
                className={[
                  'rounded-full border px-4 py-2 text-sm font-medium transition',
                  activeSubTab === tab
                    ? 'border-[#E05C2A] text-white'
                    : 'border-[#E05C2A] bg-white text-[#E05C2A] shadow-sm hover:bg-[#FEE9DF]',
                ].join(' ')}
                style={activeSubTab === tab ? { backgroundColor: BRAND } : undefined}
              >
                {tab === 'info'
                  ? 'Info'
                  : tab === 'vaccines'
                    ? 'Vaccines'
                    : tab === 'vet'
                      ? 'Vet history'
                      : 'Documents'}
              </button>
            ))}
          </div>

          {activeSubTab === 'info' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-gray-700">
                Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </label>
              <label className="text-sm text-gray-700">
                Species
                <select
                  value={form.species}
                  onChange={(e) => setForm((p) => ({ ...p, species: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                </select>
              </label>
              <label className="text-sm text-gray-700">
                Breed
                <input
                  type="text"
                  value={form.breed}
                  onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))}
                />
              </label>
              <label className="text-sm text-gray-700">
                Date of birth
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  className={FORM_INPUT_CLASS}
                />
              </label>
              <label className="text-sm text-gray-700">
                Gender
                <select
                  value={form.gender}
                  onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>
              <label className="text-sm text-gray-700">
                Weight (kg)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
                  className={FORM_INPUT_CLASS}
                />
              </label>
              <label className="text-sm text-gray-700">
                Color
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                />
              </label>
              <label className="text-sm text-gray-700">
                Microchip
                <input
                  type="text"
                  value={form.microchip}
                  onChange={(e) => setForm((p) => ({ ...p, microchip: e.target.value }))}
                />
              </label>
              <label className="text-sm text-gray-700">
                Neutered
                <select
                  value={form.neutered}
                  onChange={(e) => setForm((p) => ({ ...p, neutered: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </label>
              <label className="text-sm text-gray-700">
                Usual vet
                <input
                  type="text"
                  value={form.usualVet}
                  onChange={(e) => setForm((p) => ({ ...p, usualVet: e.target.value }))}
                />
              </label>
              <label className="text-sm text-gray-700 sm:col-span-2">
                Allergies
                <input
                  type="text"
                  value={form.allergies}
                  onChange={(e) => setForm((p) => ({ ...p, allergies: e.target.value }))}
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-2 sm:col-span-2">
                <button type="button" className="primary" onClick={saveInfo} disabled={busy}>
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="bg-red-100 text-red-700"
                  onClick={removePet}
                  disabled={busy}
                >
                  Remove pet
                </button>
              </div>
            </div>
          ) : null}

          {activeSubTab === 'vaccines' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  Total: {vaccineStats.total}
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                  Up to date: {vaccineStats.ok}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                  Due soon: {vaccineStats.due}
                </span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
                  Expired: {vaccineStats.expired}
                </span>
              </div>

              <div className="space-y-2">
                {(form.vaccines ?? []).map((vaccine) => (
                  <div
                    key={vaccine._id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{vaccine.name}</p>
                      <p className="text-gray-500">
                        Given: {formatDate(vaccine.givenDate)} • Next: {formatDate(vaccine.nextDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs ${statusClasses(vaccine.status)}`}>
                        {statusText(vaccine.status)}
                      </span>
                      <button
                        type="button"
                        className="bg-red-100 px-3 py-1 text-xs text-red-700"
                        onClick={() => deleteVaccine(vaccine._id)}
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 rounded-xl border border-dashed border-gray-300 p-3 sm:grid-cols-4">
                <input
                  type="text"
                  placeholder="Vaccine name"
                  value={vaccineDraft.name}
                  onChange={(e) =>
                    setVaccineDraft((p) => ({ ...p, name: e.target.value }))
                  }
                />
                <input
                  type="date"
                  value={vaccineDraft.givenDate}
                  onChange={(e) =>
                    setVaccineDraft((p) => ({ ...p, givenDate: e.target.value }))
                  }
                />
                <input
                  type="date"
                  value={vaccineDraft.nextDate}
                  onChange={(e) =>
                    setVaccineDraft((p) => ({ ...p, nextDate: e.target.value }))
                  }
                />
                <button type="button" className="primary" onClick={addVaccine} disabled={busy}>
                  + Add vaccine
                </button>
              </div>
            </div>
          ) : null}

          {activeSubTab === 'vet' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  Total visits: {vetStats.total}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  This year: {vetStats.thisYear}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  Upcoming: {vetStats.upcoming}
                </span>
              </div>

              <div className="space-y-2">
                {(form.vetHistory ?? []).map((entry) => (
                  <div key={entry._id || `${entry.title}-${entry.date}`} className="rounded-xl border border-gray-200 p-3">
                    <p className="font-medium text-gray-800">{entry.title}</p>
                    <p className="text-sm text-gray-600">
                      {entry.proName || 'Professional not set'} • {formatDate(entry.date)}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">{entry.notes || '—'}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 rounded-xl border border-dashed border-gray-300 p-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Visit title"
                  value={vetDraft.title}
                  onChange={(e) => setVetDraft((p) => ({ ...p, title: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Professional name"
                  value={vetDraft.proName}
                  onChange={(e) => setVetDraft((p) => ({ ...p, proName: e.target.value }))}
                />
                <input
                  type="date"
                  value={vetDraft.date}
                  onChange={(e) => setVetDraft((p) => ({ ...p, date: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Notes/report"
                  value={vetDraft.notes}
                  onChange={(e) => setVetDraft((p) => ({ ...p, notes: e.target.value }))}
                />
                <button type="button" className="primary sm:col-span-2" onClick={addVetEntry} disabled={busy}>
                  + Add manual entry
                </button>
              </div>
            </div>
          ) : null}

          {activeSubTab === 'documents' ? (
            <div className="space-y-3">
              {(form.documents ?? []).map((doc) => (
                <div
                  key={doc._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-800">{doc.name}</p>
                    <p className="text-gray-500">
                      {doc.fileType || '—'} • {(doc.fileSize || 0) > 0 ? `${Math.ceil(doc.fileSize / 1024)} KB` : '—'} • {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={photoSrc(doc.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="secondary !px-3 !py-1 !text-xs"
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      className="bg-red-100 px-3 py-1 text-xs text-red-700"
                      onClick={() => deleteDocument(doc._id)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              <label className="primary inline-flex cursor-pointer px-4 py-2 text-sm">
                + Upload document
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadDocument(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          ) : null}
        </>
      )}

    </div>
  )
}
