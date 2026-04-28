import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../../api/client.js'

export default function ProServicesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [specialty, setSpecialty] = useState('vet')
  const [services, setServices] = useState([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState('')

  useEffect(() => {
    let ignore = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [profileRes, servicesRes] = await Promise.all([api.get('/api/pro/profile'), api.get('/api/pro/services')])
        if (ignore) return
        const s = String(profileRes.data?.professional?.specialty || 'vet').toLowerCase()
        setSpecialty(s)
        setServices(Array.isArray(servicesRes.data?.services) ? servicesRes.data.services : [])
      } catch (e) {
        if (!ignore) {
          setError(e?.response?.data?.error || e?.message || 'Could not load services page.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [])

  const serviceLabel = useMemo(() => {
    const map = { vet: 'Vet', grooming: 'Groomer', sitting: 'Sitter', training: 'Trainer' }
    return map[specialty] || 'Professional'
  }, [specialty])

  async function addService() {
    const n = name.trim()
    const p = Number(price)
    const d =
      duration === '' || duration == null ? null : Number.parseInt(String(duration), 10)
    const desc = description.trim()
    if (!n) {
      setError('Service name is required.')
      return
    }
    if (!Number.isFinite(p) || p <= 0) {
      setError('Price must be a positive number.')
      return
    }
    if (d != null && (!Number.isFinite(d) || d <= 0)) {
      setError('Duration must be a positive number when provided.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await api.post('/api/pro/services', {
        name: n,
        price: Math.round(p),
        duration: d == null ? null : Math.round(d),
        description: desc,
      })
      setServices(Array.isArray(res.data?.services) ? res.data.services : [])
      setName('')
      setPrice('')
      setDuration('')
      setDescription('')
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not add service.')
    } finally {
      setSaving(false)
    }
  }

  async function removeService(serviceId) {
    if (!serviceId) return
    setRemovingId(String(serviceId))
    setError('')
    try {
      await api.delete(`/api/pro/services/${serviceId}`)
      setServices((prev) => prev.filter((s) => String(s._id) !== String(serviceId)))
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not remove service.')
    } finally {
      setRemovingId('')
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-sm text-gray-600">Loading services…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
        <p className="mt-1 text-sm text-gray-600">Manage the services your {serviceLabel.toLowerCase()} profile offers.</p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Add service</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Service name"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E05C2A]"
          />
          <input
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price (MAD)"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E05C2A]"
          />
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duration (min, optional)"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E05C2A]"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E05C2A] sm:col-span-3"
          />
          <button
            type="button"
            onClick={addService}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E05C2A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c94e22]"
          >
            <Plus className="h-4 w-4" />
            {saving ? 'Adding…' : 'Add service'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Your services</h2>
        {services.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No services yet. Add your first service above.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {services.map((s) => (
              <li key={s._id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">
                    {s.price} MAD · {s.duration} min
                  </p>
                  {s.description ? <p className="mt-1 text-xs text-gray-500">{s.description}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeService(s._id)}
                  disabled={removingId === String(s._id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-700 transition hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {removingId === String(s._id) ? 'Removing…' : 'Remove'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
