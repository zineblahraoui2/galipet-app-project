import { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import { format } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css'
import { MapPin, Star, UserRound } from 'lucide-react'
import { api } from '../../api/client.js'

const BRAND = '#E05C2A'

const SERVICE_OPTIONS = [
  { value: 'vet', label: 'Veterinarian' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'sitting', label: 'Pet sitting' },
  { value: 'training', label: 'Training' },
]

const DEFAULT_PRICE = {
  vet: 350,
  grooming: 220,
  sitting: 180,
  training: 280,
}

const TIME_SLOTS = []
for (let h = 9; h <= 18; h++) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)

function startOfToday() {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

function toNoonIso(date) {
  if (!date) return ''
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).toISOString()
}

function serviceLabel(type) {
  return SERVICE_OPTIONS.find((o) => o.value === type)?.label || type
}

function normalizePro(pro) {
  if (!pro) return null
  return {
    _id: pro._id,
    name: pro.name || 'Professional',
    specialty: String(pro.specialty || 'vet').toLowerCase(),
    location: pro.location || pro.city || '',
    city: pro.city || '',
    rating: Number(pro.rating || 0),
    avatar: pro.avatar || '',
  }
}

export default function BookingModal({ preSelectedPro = null, onClose, onSuccess }) {
  const presetPro = useMemo(() => normalizePro(preSelectedPro), [preSelectedPro])
  const [step, setStep] = useState(1)
  const [pets, setPets] = useState([])
  const [pros, setPros] = useState([])
  const [prosLoading, setProsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [petsLoading, setPetsLoading] = useState(true)

  const [serviceType, setServiceType] = useState(presetPro?.specialty || 'vet')
  const [petId, setPetId] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPro, setSelectedPro] = useState(presetPro)
  const [bookingDate, setBookingDate] = useState(() => new Date())
  const [timeSlot, setTimeSlot] = useState('10:00')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setPetsLoading(true)
      try {
        const { data } = await api.get('/api/pets')
        const list = Array.isArray(data?.pets) ? data.pets : []
        if (cancelled) return
        setPets(list)
        if (list[0]?._id) setPetId(String(list[0]._id))
      } catch {
        if (!cancelled) setPets([])
      } finally {
        if (!cancelled) setPetsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (presetPro) return
    if (step !== 2) return
    let cancelled = false
    ;(async () => {
      setProsLoading(true)
      try {
        const { data } = await api.get('/api/professionals', { params: { type: serviceType } })
        if (!cancelled) {
          setPros(Array.isArray(data?.professionals) ? data.professionals : [])
        }
      } catch {
        if (!cancelled) setPros([])
      } finally {
        if (!cancelled) setProsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [presetPro, serviceType, step])

  const price = DEFAULT_PRICE[serviceType] ?? 200

  const handleNextFromStep1 = () => {
    if (!petId) return
    setError('')
    setStep(presetPro ? 3 : 2)
  }

  const handleConfirm = async () => {
    if (!petId || !selectedPro) return
    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/bookings', {
        professionalId: selectedPro._id,
        pet: petId,
        serviceType: selectedPro.specialty,
        date: toNoonIso(bookingDate),
        timeSlot,
        notes,
        price,
      })
      onSuccess?.()
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not create booking.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">New booking</h2>
          <button type="button" onClick={onClose} className="secondary secondary--icon" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="p-4">
          <div className="mb-6 flex justify-center gap-2">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className="h-2.5 w-2.5 rounded-full transition"
                style={{ backgroundColor: step >= n ? BRAND : '#e5e7eb' }}
              />
            ))}
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Service type</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  disabled={Boolean(presetPro)}
                >
                  {SERVICE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Pet</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={petId}
                  onChange={(e) => setPetId(e.target.value)}
                  disabled={petsLoading}
                >
                  {pets.length === 0 ? (
                    <option value="">No pets — add one in My pets</option>
                  ) : (
                    pets.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notes (optional)</label>
                <textarea
                  className="min-h-[88px] w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything the professional should know..."
                />
              </div>
              <button type="button" disabled={!petId} className="primary w-full disabled:opacity-50" onClick={handleNextFromStep1}>
                Continue
              </button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Choose a professional for your area.</p>
              {prosLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                  ))}
                </div>
              ) : pros.length === 0 ? (
                <p className="text-sm text-gray-500">No professionals for this service yet.</p>
              ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {pros.map((p) => {
                    const active = selectedPro?._id === p._id
                    return (
                      <li key={p._id}>
                        <button
                          type="button"
                          onClick={() => setSelectedPro(normalizePro(p))}
                          className={[
                            'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition',
                            active ? 'border-orange-300 bg-orange-50 ring-1 ring-orange-200' : 'border-gray-200 hover:border-gray-300',
                          ].join(' ')}
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">
                            {p.avatar ? (
                              <img src={p.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                            ) : (
                              <UserRound className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900">{p.name}</p>
                            <p className="truncate text-xs text-gray-500">
                              {p.location || p.city} · ★ {Number(p.rating || 0).toFixed(1)}
                            </p>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
              <div className="flex gap-2">
                <button type="button" className="secondary flex-1 !py-2" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" disabled={!selectedPro} className="primary flex-1 disabled:opacity-50" onClick={() => setStep(3)}>
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                <DatePicker
                  selected={bookingDate}
                  onChange={(d) => d && setBookingDate(d)}
                  minDate={startOfToday()}
                  dateFormat="d MMM yyyy"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  wrapperClassName="w-full"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Time</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={[
                        'rounded-lg border py-2 text-xs font-medium transition sm:text-sm',
                        timeSlot === slot
                          ? 'border-orange-400 text-white'
                          : 'border-[#E05C2A]/25 bg-white text-gray-700 hover:border-[#E05C2A]/40 hover:bg-[#FEE9DF]/50',
                      ].join(' ')}
                      style={timeSlot === slot ? { backgroundColor: BRAND, borderColor: BRAND } : undefined}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-[#fff7f3] p-3 text-sm">
                <p className="font-semibold text-gray-900">Summary</p>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>Service: {serviceLabel(serviceType)}</li>
                  <li>Pet: {pets.find((p) => p._id === petId)?.name || '—'}</li>
                  <li className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#E05C2A]" />
                    Pro: {selectedPro?.name}
                  </li>
                  <li>When: {bookingDate ? format(bookingDate, 'd MMM yyyy') : '—'} · {timeSlot}</li>
                  <li className="flex items-center gap-1 font-medium text-gray-900">
                    <Star className="h-3.5 w-3.5 fill-[#E05C2A] text-[#E05C2A]" />
                    Est. {price} MAD
                  </li>
                </ul>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="secondary flex-1 !py-2"
                  onClick={() => setStep(presetPro ? 1 : 2)}
                >
                  Back
                </button>
                <button type="button" disabled={submitting || !selectedPro} className="primary flex-1 disabled:opacity-50" onClick={handleConfirm}>
                  {submitting ? 'Saving…' : 'Confirm booking'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
