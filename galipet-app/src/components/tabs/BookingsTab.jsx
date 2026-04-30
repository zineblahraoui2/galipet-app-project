import { useCallback, useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import { format } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { combineDateAndTimeSlot, enrichOwnerBookingForDisplay } from '../../utils/ownerBooking.js'
import BookingActions, { StatusBadge } from '../BookingActions.jsx'

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
for (let h = 9; h <= 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
}

function serviceLabel(type) {
  return SERVICE_OPTIONS.find((o) => o.value === type)?.label || type
}

function startOfToday() {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

function bookingDateTime(booking) {
  const d = new Date(booking.date)
  const [hh = 9, mm = 0] = String(booking.timeSlot || '09:00')
    .split(':')
    .map((n) => parseInt(n, 10))
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0, 0)
}

function isUpcoming(booking) {
  return ['pending', 'confirmed'].includes(String(booking.status))
}

function isPastTab(booking) {
  if (booking.status === 'cancelled') return false
  if (['completed', 'no_show'].includes(booking.status)) return true
  if (['pending', 'confirmed', 'late', 'rescheduled'].includes(booking.status)) {
    return bookingDateTime(booking) < new Date()
  }
  return false
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center shadow-sm">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  )
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-xl bg-gray-100"
          aria-hidden
        />
      ))}
    </div>
  )
}

function ModalShell({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="secondary secondary--icon"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export default function BookingsTab() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [listTab, setListTab] = useState('upcoming')
  const [expandedId, setExpandedId] = useState(null)
  const [toast, setToast] = useState('')

  const [showNewModal, setShowNewModal] = useState(false)
  const [step, setStep] = useState(1)
  const [pets, setPets] = useState([])
  const [pros, setPros] = useState([])
  const [prosLoading, setProsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [serviceType, setServiceType] = useState('vet')
  const [petId, setPetId] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPro, setSelectedPro] = useState(null)
  const [bookingDate, setBookingDate] = useState(() => new Date())
  const [timeSlot, setTimeSlot] = useState('10:00')

  const [modifyBooking, setModifyBooking] = useState(null)
  const [modifyDate, setModifyDate] = useState(null)
  const [modifyTime, setModifyTime] = useState('10:00')

  const [cancelBooking, setCancelBooking] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  const showToast = useCallback((msg) => {
    setToast(msg)
  }, [])

  const loadBookings = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/bookings')
      const rows = Array.isArray(data?.bookings) ? data.bookings : []
      setBookings(rows.map(enrichOwnerBookingForDisplay))
    } catch {
      setBookings([])
      showToast('Could not load bookings.')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 4000)
    return () => window.clearTimeout(t)
  }, [toast])

  const stats = useMemo(() => {
    const total = bookings.length
    const upcoming = bookings.filter((b) => ['pending', 'confirmed'].includes(String(b.status))).length
    const completed = bookings.filter((b) => b.status === 'completed').length
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length
    return { total, upcoming, completed, cancelled }
  }, [bookings])

  const filteredList = useMemo(() => {
    if (listTab === 'upcoming') return bookings.filter(isUpcoming)
    if (listTab === 'past') return bookings.filter(isPastTab)
    return bookings.filter((b) => b.status === 'cancelled')
  }, [bookings, listTab])

  const openNewModal = async (preset) => {
    setStep(1)
    setNotes('')
    setSelectedPro(null)
    setTimeSlot('10:00')
    setBookingDate(new Date())
    if (preset?.serviceType) setServiceType(preset.serviceType)
    else setServiceType('vet')
    setPetId(preset?.petId || '')
    setShowNewModal(true)
    try {
      const { data } = await api.get('/api/pets')
      const list = data.pets || []
      setPets(list)
      if (!preset?.petId && list[0]?._id) setPetId(list[0]._id)
    } catch {
      setPets([])
    }
  }

  useEffect(() => {
    if (!showNewModal || step !== 2) return
    let cancelled = false
    ;(async () => {
      setProsLoading(true)
      try {
        const { data } = await api.get('/api/professionals', {
          params: { type: serviceType },
        })
        if (!cancelled) setPros(data.professionals || [])
      } catch {
        if (!cancelled) setPros([])
      } finally {
        if (!cancelled) setProsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [showNewModal, step, serviceType])

  const price = DEFAULT_PRICE[serviceType] ?? 200

  const handleConfirmBooking = async () => {
    if (!petId || !selectedPro) return
    const services = Array.isArray(selectedPro.services) ? selectedPro.services : []
    const service = services[0]
    const startAt = combineDateAndTimeSlot(bookingDate, timeSlot)
    if (!startAt || Number.isNaN(startAt.getTime())) {
      showToast('Pick a valid date and time.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/api/bookings', {
        professionalId: selectedPro._id,
        pet: petId,
        serviceId: service?._id || null,
        startAt: startAt.toISOString(),
        notes,
      })
      setShowNewModal(false)
      showToast('Booking confirmed! We will follow up soon.')
      await loadBookings()
    } catch (e) {
      showToast(e.response?.data?.error || 'Could not create booking.')
    } finally {
      setSubmitting(false)
    }
  }

  const openModify = (b) => {
    setModifyDate(new Date(b.date))
    setModifyTime(b.timeSlot || '10:00')
    setModifyBooking(b)
  }

  const submitModify = async () => {
    if (!modifyBooking) return
    const startAt = combineDateAndTimeSlot(modifyDate, modifyTime)
    if (!startAt || Number.isNaN(startAt.getTime())) return
    try {
      await api.patch(`/api/bookings/${modifyBooking._id}`, {
        startAt: startAt.toISOString(),
      })
      setModifyBooking(null)
      showToast('Booking updated.')
      await loadBookings()
    } catch (e) {
      showToast(e.response?.data?.error || 'Update failed.')
    }
  }

  const submitCancel = async () => {
    if (!cancelBooking) return
    try {
      await api.patch(`/api/bookings/${cancelBooking._id}/cancel`, {
        cancelledBy: 'owner',
        cancelReason: cancelReason || 'Cancelled by owner',
      })
      setCancelBooking(null)
      setCancelReason('')
      showToast('Booking cancelled.')
      await loadBookings()
    } catch (e) {
      showToast(e.response?.data?.error || 'Cancel failed.')
    }
  }

  const subTabBtn = (id, label) => (
    <button
      type="button"
      key={id}
      onClick={() => setListTab(id)}
      className={[
        'rounded-full border px-4 py-1.5 text-sm font-medium transition',
        listTab === id
          ? 'border-[#E05C2A] text-white shadow-sm'
          : 'border-[#E05C2A] bg-white text-[#E05C2A] shadow-sm hover:bg-[#FEE9DF]',
      ].join(' ')}
      style={listTab === id ? { backgroundColor: BRAND } : undefined}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-6">
      {toast ? (
        <div
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-5 py-2 text-sm font-medium text-white shadow-lg"
          style={{ backgroundColor: BRAND }}
          role="status"
        >
          {toast}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Bookings</h1>
        <button type="button" className="primary" onClick={() => openNewModal()}>
          + New booking
        </button>
      </div>

      {loading ? (
        <SkeletonCards />
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Upcoming" value={stats.upcoming} />
          <StatCard label="Completed" value={stats.completed} />
          <StatCard label="Cancelled" value={stats.cancelled} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {subTabBtn('upcoming', 'Upcoming')}
        {subTabBtn('past', 'Past')}
        {subTabBtn('cancelled', 'Cancelled')}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-orange-50/40 px-6 py-14 text-center">
          <p className="text-lg font-medium text-gray-800">No bookings here yet</p>
          <p className="mt-2 text-sm text-gray-600">
            When you schedule care for your pets, it will show up in this list.
          </p>
          <button type="button" className="primary mt-6" onClick={() => openNewModal()}>
            Book something
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredList.map((b) => {
            const pet = b.pet
            const petName = typeof pet === 'object' && pet?.name ? pet.name : 'Pet'
            const expanded = expandedId === b._id
            const icon =
              b.serviceType === 'vet'
                ? '🩺'
                : b.serviceType === 'grooming'
                  ? '✂️'
                  : b.serviceType === 'sitting'
                    ? '🏠'
                    : '🎾'
            return (
              <li
                key={b._id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#FEE9DF]/40"
                  onClick={() => setExpandedId(expanded ? null : b._id)}
                >
                  <span className="text-2xl" aria-hidden>
                    {icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">
                      {serviceLabel(b.serviceType)} · {b.professional?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(b.date), 'EEE d MMM')} · {b.timeSlot}
                    </p>
                  </div>
                  <span className="shrink-0">
                    <StatusBadge status={b.status} />
                  </span>
                </button>
                {expanded ? (
                  <div className="space-y-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-700">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <p>
                        <span className="font-medium text-gray-900">Pet:</span> {petName}
                        {typeof pet === 'object' && pet?.species
                          ? ` · ${pet.species}`
                          : ''}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">Service:</span>{' '}
                        {serviceLabel(b.serviceType)}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">Location:</span>{' '}
                        {b.professional?.location || '—'}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">Price:</span>{' '}
                        {b.price != null ? `${b.price} MAD` : '—'}
                      </p>
                    </div>
                    {b.notes ? (
                      <p>
                        <span className="font-medium text-gray-900">Notes:</span> {b.notes}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['pending', 'confirmed', 'late', 'rescheduled'].includes(b.status) ? (
                        <>
                          <button type="button" className="secondary !px-4 !py-1.5" onClick={() => openModify(b)}>
                            Modify
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                            onClick={() => setCancelBooking(b)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : null}
                      {b.status === 'completed' ? (
                        <>
                          <button
                            type="button"
                            className="primary !px-4 !py-1.5"
                            onClick={() =>
                              openNewModal({
                                serviceType: b.serviceType,
                                petId: typeof b.pet === 'object' ? b.pet?._id : b.pet,
                              })
                            }
                          >
                            Rebook
                          </button>
                          <Link
                            to={`/review/${b._id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                          >
                            Leave review
                          </Link>
                        </>
                      ) : null}
                      {b.status === 'cancelled' ? (
                        <button
                          type="button"
                          className="primary !px-4 !py-1.5"
                          onClick={() =>
                            openNewModal({
                              serviceType: b.serviceType,
                              petId: typeof b.pet === 'object' ? b.pet?._id : b.pet,
                            })
                          }
                        >
                          Rebook
                        </button>
                      ) : null}
                    </div>
                    <BookingActions
                      booking={b}
                      userRole="owner"
                      onBookingUpdated={(ub) =>
                        setBookings((prev) =>
                          prev.map((x) =>
                            String(x._id) === String(ub._id)
                              ? enrichOwnerBookingForDisplay({ ...x, ...ub })
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {showNewModal ? (
        <ModalShell title="New booking" onClose={() => setShowNewModal(false)}>
          <div className="mb-6 flex justify-center gap-2">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className="h-2.5 w-2.5 rounded-full transition"
                style={{
                  backgroundColor: step >= n ? BRAND : '#e5e7eb',
                }}
                aria-label={`Step ${n}`}
              />
            ))}
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Service type
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  {SERVICE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Pet
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={petId}
                  onChange={(e) => setPetId(e.target.value)}
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
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <textarea
                  className="min-h-[88px] w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything the professional should know…"
                />
              </div>
              <button
                type="button"
                disabled={!petId}
                className="primary w-full disabled:opacity-50"
                onClick={() => setStep(2)}
              >
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
                          onClick={() => setSelectedPro(p)}
                          className={[
                            'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition',
                            active
                              ? 'border-orange-300 bg-orange-50 ring-1 ring-orange-200'
                              : 'border-gray-200 hover:border-gray-300',
                          ].join(' ')}
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">
                            {p.avatar ? (
                              <img src={p.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                            ) : (
                              '👤'
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900">{p.name}</p>
                            <p className="truncate text-xs text-gray-500">
                              {p.location || p.city} · ★ {p.rating?.toFixed(1) ?? '—'}
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
                <button
                  type="button"
                  disabled={!selectedPro}
                  className="primary flex-1 disabled:opacity-50"
                  onClick={() => setStep(3)}
                >
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
              <div
                className="rounded-xl border border-gray-100 p-3 text-sm"
                style={{ backgroundColor: '#fff7f3' }}
              >
                <p className="font-semibold text-gray-900">Summary</p>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>Service: {serviceLabel(serviceType)}</li>
                  <li>
                    Pet:{' '}
                    {pets.find((p) => p._id === petId)?.name || '—'}
                  </li>
                  <li>Pro: {selectedPro?.name}</li>
                  <li>
                    When: {bookingDate ? format(bookingDate, 'd MMM yyyy') : '—'} · {timeSlot}
                  </li>
                  <li className="font-medium text-gray-900">Est. {price} MAD</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <button type="button" className="secondary flex-1 !py-2" onClick={() => setStep(2)}>
                  Back
                </button>
                <button
                  type="button"
                  disabled={submitting || !selectedPro}
                  className="primary flex-1 disabled:opacity-50"
                  onClick={handleConfirmBooking}
                >
                  {submitting ? 'Saving…' : 'Confirm booking'}
                </button>
              </div>
            </div>
          ) : null}
        </ModalShell>
      ) : null}

      {modifyBooking ? (
        <ModalShell title="Modify booking" onClose={() => setModifyBooking(null)}>
          <div className="space-y-4">
            <DatePicker
              selected={modifyDate}
              onChange={(d) => d && setModifyDate(d)}
              minDate={startOfToday()}
              dateFormat="d MMM yyyy"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              wrapperClassName="w-full"
            />
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setModifyTime(slot)}
                  className={[
                    'rounded-lg border py-2 text-xs font-medium sm:text-sm',
                    modifyTime === slot ? 'text-white' : 'border-[#E05C2A]/25 bg-white hover:border-[#E05C2A]/40',
                  ].join(' ')}
                  style={
                    modifyTime === slot
                      ? { backgroundColor: BRAND, borderColor: BRAND }
                      : undefined
                  }
                >
                  {slot}
                </button>
              ))}
            </div>
            <button type="button" className="primary w-full" onClick={submitModify}>
              Save changes
            </button>
          </div>
        </ModalShell>
      ) : null}

      {cancelBooking ? (
        <ModalShell title="Cancel booking" onClose={() => setCancelBooking(null)}>
          <p className="text-sm text-gray-600">
            Let us know why you are cancelling (optional). You can always book again later.
          </p>
          <textarea
            className="mt-3 min-h-[88px] w-full rounded-lg border border-gray-300 px-3 py-2"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason…"
          />
          <button
            type="button"
            className="mt-4 w-full rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            onClick={submitCancel}
          >
            Confirm cancellation
          </button>
        </ModalShell>
      ) : null}
    </div>
  )
}
