import axios from 'axios'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client.js'
import Toast from '../../components/pro/Toast.jsx'
import { UserContext } from '../../UserContext.jsx'

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const tabs = [
  { id: 'profile', icon: '👤', label: 'My Profile' },
  { id: 'practice', icon: '🏥', label: 'My Practice' },
  { id: 'credentials', icon: '🛡️', label: 'Credentials' },
  { id: 'account', icon: '⚙️', label: 'Account' },
]

const SPECIES_OPTIONS = ['Dogs 🐕', 'Cats 🐱', 'Birds 🐦', 'Rabbits 🐇']
const PAYMENT_OPTIONS = ['Cash 💵', 'Bank transfer 🏦', 'Card 💳']
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

const SPECIALTY_LABELS = {
  vet: 'Veterinary',
  grooming: 'Grooming',
  sitting: 'Pet sitting',
  training: 'Training',
}

function mediaUrl(path) {
  if (!path) return ''
  if (String(path).startsWith('http')) return path
  return `${apiBase}${path}`
}

function StatusBadge({ status }) {
  const s = String(status || 'pending')
  if (s === 'verified') {
    return (
      <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
        Verified
      </span>
    )
  }
  if (s === 'rejected') {
    return (
      <span className="mt-1 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
        Not verified
      </span>
    )
  }
  return (
    <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
      Pending review
    </span>
  )
}

function FieldLabel({ children }) {
  return <label className="mb-1 block text-xs text-gray-500">{children}</label>
}

function TextInput({ className = '', ...props }) {
  return (
    <input
      className={[
        'mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#D85A30]',
        className,
      ].join(' ')}
      {...props}
    />
  )
}

function normalizeDescription(desc) {
  if (!desc) return ''
  if (typeof desc === 'string') {
    try {
      const parsed = JSON.parse(desc)
      if (Array.isArray(parsed)) return parsed.join(', ')
      return desc
    } catch {
      return desc
    }
  }
  if (Array.isArray(desc)) return desc.join(', ')
  return String(desc)
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { setUser, logout } = useContext(UserContext)

  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [pro, setPro] = useState(null)

  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('vet')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [languages, setLanguages] = useState('')
  const [species, setSpecies] = useState([])

  const [practiceName, setPracticeName] = useState('')
  const [address, setAddress] = useState('')
  const [practiceCity, setPracticeCity] = useState('')
  const [mapLink, setMapLink] = useState('')
  const [consultationFee, setConsultationFee] = useState('')
  const [homeVisit, setHomeVisit] = useState(false)
  const [homeVisitFee, setHomeVisitFee] = useState('')
  const [paymentMethods, setPaymentMethods] = useState([])
  const [weeklySchedule, setWeeklySchedule] = useState(null)

  const [licenseNumber, setLicenseNumber] = useState('')
  const [experience, setExperience] = useState(0)
  const [education, setEducation] = useState('')
  const [certifications, setCertifications] = useState('')
  const [newDegree, setNewDegree] = useState(null)

  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [notifs, setNotifs] = useState({
    newBooking: true,
    messages: true,
    reviews: true,
    reminders: true,
  })

  const showToast = useCallback((message, type = 'ok') => {
    setToast({ message, type: type === 'error' ? 'error' : 'ok' })
  }, [])

  const applyProfilePayload = useCallback((data) => {
    const p = data?.professional
    const u = data?.user
    if (!p) return
    setPro(p)
    setName(p.name || '')
    setSpecialty(p.specialty || 'vet')
    setPhone(p.phone || '')
    setCity(p.city || '')
    setLocation(p.location || '')
    setDescription(normalizeDescription(p.description))
    setLanguages(p.languages || '')
    setSpecies(Array.isArray(p.speciesWorked) ? p.speciesWorked : [])
    setPracticeName(p.practiceName || '')
    setAddress(p.practiceAddress || '')
    setPracticeCity(p.city || '')
    setMapLink(p.mapLink || '')
    setConsultationFee(p.consultationFee != null && p.consultationFee !== '' ? String(p.consultationFee) : '')
    setHomeVisit(Boolean(p.homeVisit))
    setHomeVisitFee(p.homeVisitFee != null && p.homeVisitFee !== '' ? String(p.homeVisitFee) : '')
    setPaymentMethods(Array.isArray(p.paymentMethods) ? p.paymentMethods : [])
    setWeeklySchedule(p.weeklySchedule || null)
    setLicenseNumber(p.licenseNumber || '')
    setExperience(Number(p.experience) || 0)
    setEducation(p.education || '')
    setCertifications(p.certifications || '')
    if (u) {
      setEmail(u.email || '')
      setNotifs({
        newBooking: Boolean(u.proNotifications?.newBooking !== false),
        messages: Boolean(u.proNotifications?.messages !== false),
        reviews: Boolean(u.proNotifications?.reviews !== false),
        reminders: Boolean(u.proNotifications?.reminders !== false),
      })
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/api/pro/profile')
      applyProfilePayload(data)
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not load profile.')
    } finally {
      setLoading(false)
    }
  }, [applyProfilePayload])

  useEffect(() => {
    load()
  }, [load])

  const refreshSessionUser = useCallback(async () => {
    try {
      const { data } = await api.get('/profile')
      if (data?.ok && data?.user?.email) {
        setUser(data.user)
      }
    } catch {
      // ignore
    }
  }, [setUser])

  const toggleSpecies = (animal) => {
    setSpecies((prev) => (prev.includes(animal) ? prev.filter((a) => a !== animal) : [...prev, animal]))
  }

  const togglePayment = (method) => {
    setPaymentMethods((prev) => (prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]))
  }

  const toggleNotif = (key) => {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const updateWeekday = (dayKey, patch) => {
    setWeeklySchedule((prev) => {
      const base = prev && typeof prev === 'object' ? { ...prev } : {}
      const slot = base[dayKey] && typeof base[dayKey] === 'object' ? { ...base[dayKey] } : { enabled: false, start: '09:00', end: '18:00', breakStart: '', breakEnd: '' }
      base[dayKey] = { ...slot, ...patch }
      return base
    })
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const { data } = await axios.post(`${apiBase}/api/pro/profile/avatar`, fd, { withCredentials: true })
      if (data?.professional) {
        setPro(data.professional)
        showToast('Photo updated')
        await refreshSessionUser()
      }
    } catch (err) {
      showToast(err?.response?.data?.error || err?.message || 'Upload failed', 'error')
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { data } = await api.patch('/api/pro/profile', {
        name,
        specialty,
        phone,
        city,
        location,
        description,
        languages,
        speciesWorked: species,
      })
      applyProfilePayload(data)
      showToast('Saved successfully ✓')
      await refreshSessionUser()
    } catch (err) {
      showToast(err?.response?.data?.error || err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePractice = async () => {
    setSaving(true)
    try {
      const patchReq = api.patch('/api/pro/profile', {
        city: practiceCity,
        practiceName,
        practiceAddress: address,
        mapLink,
        consultationFee: consultationFee === '' ? null : Number(consultationFee),
        homeVisit,
        homeVisitFee: homeVisitFee === '' ? null : Number(homeVisitFee),
        paymentMethods,
      })
      const scheduleReq = weeklySchedule ? api.put('/api/pro/schedule', { weeklySchedule }) : null
      const results = await Promise.all(scheduleReq ? [patchReq, scheduleReq] : [patchReq])
      applyProfilePayload(results[0].data)
      showToast('Saved successfully ✓')
      await refreshSessionUser()
    } catch (err) {
      showToast(err?.response?.data?.error || err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCredentials = async () => {
    setSaving(true)
    try {
      const { data } = await api.patch('/api/pro/profile', {
        licenseNumber,
        experience,
        education,
        certifications,
      })
      applyProfilePayload(data)
      if (newDegree) {
        const fd = new FormData()
        fd.append('degree', newDegree)
        const up = await axios.post(`${apiBase}/api/pro/profile/degree`, fd, { withCredentials: true })
        if (up.data?.professional) {
          applyProfilePayload(up.data)
        }
        setNewDegree(null)
      }
      showToast('Saved successfully ✓')
    } catch (err) {
      showToast(err?.response?.data?.error || err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAccount = async () => {
    setSaving(true)
    try {
      await api.patch('/api/users/me', {
        email,
        proNotifications: notifs,
      })
      if (newPassword.trim()) {
        await api.patch('/api/users/me/password', {
          currentPassword,
          newPassword,
        })
        setCurrentPassword('')
        setNewPassword('')
      }
      showToast('Saved successfully ✓')
      await refreshSessionUser()
    } catch (err) {
      showToast(err?.response?.data?.error || err?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return
    try {
      await api.delete('/api/users/me')
      await logout()
      navigate('/')
    } catch (err) {
      showToast(err?.response?.data?.error || err?.message || 'Could not delete account', 'error')
    }
  }

  const verificationBanner = useMemo(() => {
    const s = String(pro?.verificationStatus || 'pending')
    if (s === 'verified') {
      return (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
          <span className="text-2xl" aria-hidden>
            ✅
          </span>
          <div>
            <p className="text-sm font-semibold">Your account is verified ✅</p>
            <p className="mt-1 text-xs text-gray-500">Your badge is visible to all pet owners.</p>
          </div>
        </div>
      )
    }
    if (s === 'rejected') {
      return (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <span className="text-2xl" aria-hidden>
            ✕
          </span>
          <div>
            <p className="text-sm font-semibold text-red-900">Verification was not approved</p>
            <p className="mt-1 text-xs text-red-700">Update your credentials or contact support if you think this is a mistake.</p>
          </div>
        </div>
      )
    }
    return (
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <span className="text-2xl" aria-hidden>
          ⏳
        </span>
        <div>
          <p className="text-sm font-semibold">Verification pending — under review</p>
          <p className="mt-1 text-xs text-gray-500">Our team reviews credentials within 48h.</p>
        </div>
      </div>
    )
  }, [pro?.verificationStatus])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
        Loading settings…
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-red-700">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 rounded-xl bg-[#D85A30] px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Profile &amp; settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage what pet owners see and how your practice runs.</p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-100 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={[
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition',
              activeTab === t.id
                ? 'bg-[#FAECE7] text-[#D85A30] ring-1 ring-[#D85A30]/30'
                : 'text-gray-600 hover:bg-gray-50',
            ].join(' ')}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-8">
        {activeTab === 'profile' && (
          <section>
            <div className="mb-6 flex items-center gap-4">
              <div className="relative">
                {pro?.avatar ? (
                  <img
                    src={mediaUrl(pro.avatar)}
                    alt=""
                    className="h-20 w-20 rounded-full border border-gray-100 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FAECE7] text-2xl font-bold text-[#D85A30]">
                    {name?.[0] || '?'}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#D85A30] text-xs text-white shadow">
                  ✏️
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{name || 'Your name'}</p>
                <p className="text-xs capitalize text-gray-400">{SPECIALTY_LABELS[specialty] || specialty}</p>
                <StatusBadge status={pro?.verificationStatus} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <FieldLabel>Full name</FieldLabel>
                <TextInput value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Specialty</FieldLabel>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#D85A30]"
                >
                  {Object.entries(SPECIALTY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Phone number</FieldLabel>
                <TextInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <FieldLabel>City</FieldLabel>
                <TextInput value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Neighborhood / area</FieldLabel>
                <TextInput value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div>
                <FieldLabel>About me (public)</FieldLabel>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1 w-full resize-y rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#D85A30]"
                />
              </div>
              <div>
                <FieldLabel>Languages spoken</FieldLabel>
                <TextInput
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="e.g. Arabic, French, English"
                />
              </div>
            </div>

            <div className="mt-6">
              <span className="mb-2 block text-xs text-gray-500">I work with</span>
              <div className="flex flex-wrap gap-3">
                {SPECIES_OPTIONS.map((animal) => (
                  <label key={animal} className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={species.includes(animal)}
                      onChange={() => toggleSpecies(animal)}
                      className="accent-[#D85A30]"
                    />
                    {animal}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveProfile}
                className="rounded-xl bg-[#D85A30] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c24e2a] disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </section>
        )}

        {activeTab === 'practice' && (
          <section>
            <div className="space-y-4">
              <div>
                <FieldLabel>Practice / clinic name</FieldLabel>
                <TextInput
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                  placeholder="e.g. Cabinet Vétérinaire Benali"
                />
              </div>
              <div>
                <FieldLabel>Full address</FieldLabel>
                <TextInput value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div>
                <FieldLabel>City</FieldLabel>
                <TextInput value={practiceCity} onChange={(e) => setPracticeCity(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Google Maps link (optional)</FieldLabel>
                <TextInput
                  value={mapLink}
                  onChange={(e) => setMapLink(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div>
                <FieldLabel>Consultation fee (MAD)</FieldLabel>
                <TextInput
                  type="number"
                  min={0}
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                <span className="text-sm font-medium text-gray-800">Home visits available?</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={homeVisit}
                  onClick={() => setHomeVisit((v) => !v)}
                  className={[
                    'relative h-7 w-12 rounded-full transition-colors',
                    homeVisit ? 'bg-[#D85A30]' : 'bg-gray-200',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
                      homeVisit ? 'left-5' : 'left-0.5',
                    ].join(' ')}
                  />
                </button>
              </div>
              <div>
                <FieldLabel>Home visit fee (MAD)</FieldLabel>
                <TextInput
                  type="number"
                  min={0}
                  value={homeVisitFee}
                  onChange={(e) => setHomeVisitFee(e.target.value)}
                  disabled={!homeVisit}
                />
              </div>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Opening hours (Mon–Fri)</p>
              <div className="space-y-3">
                {WEEKDAYS.map((day) => {
                  const slot = weeklySchedule?.[day] || { enabled: true, start: '09:00', end: '18:00' }
                  return (
                    <div
                      key={day}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 px-3 py-2 sm:px-4"
                    >
                      <label className="flex min-w-[100px] cursor-pointer items-center gap-2 text-sm capitalize text-gray-800">
                        <input
                          type="checkbox"
                          checked={Boolean(slot.enabled)}
                          onChange={(e) => updateWeekday(day, { enabled: e.target.checked })}
                          className="accent-[#D85A30]"
                        />
                        {day.slice(0, 3)}
                      </label>
                      <input
                        type="time"
                        disabled={!slot.enabled}
                        value={slot.start || '09:00'}
                        onChange={(e) => updateWeekday(day, { start: e.target.value })}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-sm disabled:opacity-50"
                      />
                      <span className="text-gray-400">–</span>
                      <input
                        type="time"
                        disabled={!slot.enabled}
                        value={slot.end || '18:00'}
                        onChange={(e) => updateWeekday(day, { end: e.target.value })}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-sm disabled:opacity-50"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-6">
              <span className="mb-2 block text-xs text-gray-500">Payment methods accepted</span>
              <div className="space-y-2">
                {PAYMENT_OPTIONS.map((method) => (
                  <label key={method} className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={paymentMethods.includes(method)}
                      onChange={() => togglePayment(method)}
                      className="accent-[#D85A30]"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={handleSavePractice}
                className="rounded-xl bg-[#D85A30] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c24e2a] disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save practice'}
              </button>
            </div>
          </section>
        )}

        {activeTab === 'credentials' && (
          <section>
            {verificationBanner}

            <div className="space-y-4">
              <div>
                <FieldLabel>License / order number</FieldLabel>
                <TextInput
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="VET-MA-2024-00123"
                />
              </div>
              <div>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-xs text-gray-500">Years of experience</span>
                  <span className="text-sm font-semibold text-[#D85A30]">{experience}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={experience}
                  onChange={(e) => setExperience(Number(e.target.value))}
                  className="mt-1 w-full accent-[#D85A30]"
                />
              </div>
              <div>
                <FieldLabel>Education / university</FieldLabel>
                <TextInput
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. Institut Agronomique et Vétérinaire Hassan II"
                />
              </div>
              <div>
                <FieldLabel>Certifications</FieldLabel>
                <textarea
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  rows={3}
                  placeholder="e.g. Small animal surgery, Dermatology…"
                  className="mt-1 w-full resize-y rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#D85A30]"
                />
              </div>
            </div>

            {pro?.degreeUrl ? (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <span className="text-2xl" aria-hidden>
                  📄
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">Diploma on file</p>
                  <a
                    href={mediaUrl(pro.degreeUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#D85A30] hover:underline"
                  >
                    View document →
                  </a>
                </div>
              </div>
            ) : null}

            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-4 transition-all hover:border-[#D85A30] hover:bg-[#FAECE7]">
              <span className="text-2xl" aria-hidden>
                📤
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700">{newDegree ? newDegree.name : 'Upload new diploma'}</p>
                <p className="text-xs text-gray-400">PDF, JPG or PNG · Max 5MB</p>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setNewDegree(e.target.files?.[0] || null)}
              />
            </label>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveCredentials}
                className="rounded-xl bg-[#D85A30] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c24e2a] disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save credentials'}
              </button>
            </div>
          </section>
        )}

        {activeTab === 'account' && (
          <section>
            <div className="mb-4">
              <FieldLabel>Email address</FieldLabel>
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="mb-4">
              <FieldLabel>Current password</FieldLabel>
              <TextInput
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <FieldLabel>New password</FieldLabel>
              <TextInput
                type="password"
                autoComplete="new-password"
                placeholder="Leave blank to keep current"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-400">At least 8 characters if you change it.</p>
            </div>

            <div className="mb-6 border-t border-gray-100 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Notifications</p>
              {[
                { key: 'newBooking', label: 'New booking request' },
                { key: 'messages', label: 'New messages' },
                { key: 'reviews', label: 'New reviews' },
                { key: 'reminders', label: 'Appointment reminders' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between border-b border-gray-50 py-2.5">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <label className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={notifs[item.key]}
                      onChange={() => toggleNotif(item.key)}
                    />
                    <span className="h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-[#D85A30]" />
                    <span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                  </label>
                </div>
              ))}
            </div>

            <div className="mb-8 flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAccount}
                className="rounded-xl bg-[#D85A30] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c24e2a] disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save account'}
              </button>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="mb-1 text-sm font-semibold text-red-700">Danger zone</p>
              <p className="mb-3 text-xs text-red-500">Deleting your account is permanent and cannot be undone.</p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="rounded-lg border border-red-300 px-4 py-2 text-xs text-red-600 transition-colors hover:bg-red-100"
              >
                Delete my account
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
