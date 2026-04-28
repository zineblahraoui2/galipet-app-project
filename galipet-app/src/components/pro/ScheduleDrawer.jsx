import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

const TIME_OPTIONS = (() => {
  const o = []
  for (let h = 6; h <= 22; h += 1) {
    for (const m of [0, 30]) {
      if (h === 22 && m > 0) break
      o.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return o
})()

function addOneHour(t) {
  const [hh, mm] = String(t || '09:00').split(':').map(Number)
  const d = new Date(2000, 0, 1, hh, mm, 0, 0)
  d.setHours(d.getHours() + 1)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function ScheduleDrawer({ open, onClose, schedule, onSaved, onToast }) {
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dateInput, setDateInput] = useState('')

  useEffect(() => {
    if (open && schedule) {
      setDraft({
        weeklySchedule: JSON.parse(JSON.stringify(schedule.weeklySchedule || {})),
        blockedDates: [...(schedule.blockedDates || [])],
        dailyCapacity: schedule.dailyCapacity ?? 5,
      })
    }
  }, [open, schedule])


  async function handleSave() {
    if (!draft) return
    setSaving(true)
    try {
      const { data } = await api.put('/api/pro/schedule', {
        weeklySchedule: draft.weeklySchedule,
        blockedDates: draft.blockedDates,
        dailyCapacity: draft.dailyCapacity,
      })
      onSaved?.(data)
      onToast?.({ message: 'Schedule saved ✓', type: 'ok' })
      onClose?.()
    } catch (e) {
      onToast?.({ message: e?.response?.data?.error || 'Save failed, try again', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (!open || !draft) return null

  return (
    <div className="fixed inset-0 z-[75] flex justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative z-[76] flex h-full w-full max-w-full flex-col bg-white shadow-2xl sm:max-w-[420px]">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">Manage schedule</h2>
          <button type="button" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Weekly hours</h3>
            <div className="mt-3 space-y-3">
              {DAYS.map(({ key, label }) => {
                const row = draft.weeklySchedule[key] || {
                  enabled: false,
                  start: '09:00',
                  end: '18:00',
                  breakStart: '',
                  breakEnd: '',
                }
                return (
                  <div
                    key={key}
                    className={`rounded-xl border border-gray-100 p-3 ${row.enabled ? '' : 'bg-gray-50 opacity-80'}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                          row.enabled ? 'border-[#E05C2A] bg-[#FEF3EE] text-[#E05C2A]' : 'border-gray-300 text-gray-400'
                        }`}
                        aria-label={`Toggle ${label}`}
                        onClick={() => {
                          setDraft((d) => ({
                            ...d,
                            weeklySchedule: {
                              ...d.weeklySchedule,
                              [key]: { ...row, enabled: !row.enabled },
                            },
                          }))
                        }}
                      >
                        {row.enabled ? '●' : '○'}
                      </button>
                      <span className="min-w-[72px] text-sm font-semibold text-gray-800">{label}</span>
                      <select
                        disabled={!row.enabled}
                        value={row.start}
                        onChange={(e) => {
                          const start = e.target.value
                          setDraft((d) => ({
                            ...d,
                            weeklySchedule: {
                              ...d.weeklySchedule,
                              [key]: {
                                ...row,
                                start,
                                breakEnd: row.breakStart ? addOneHour(row.breakStart) : row.breakEnd,
                              },
                            },
                          }))
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs disabled:cursor-not-allowed"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-gray-500">to</span>
                      <select
                        disabled={!row.enabled}
                        value={row.end}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            weeklySchedule: {
                              ...d.weeklySchedule,
                              [key]: { ...row, end: e.target.value },
                            },
                          }))
                        }
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs disabled:cursor-not-allowed"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 pl-10">
                      <span className="text-xs text-gray-500">Break</span>
                      <select
                        disabled={!row.enabled}
                        value={row.breakStart || ''}
                        onChange={(e) => {
                          const bs = e.target.value
                          setDraft((d) => ({
                            ...d,
                            weeklySchedule: {
                              ...d.weeklySchedule,
                              [key]: {
                                ...row,
                                breakStart: bs,
                                breakEnd: bs ? addOneHour(bs) : '',
                              },
                            },
                          }))
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs disabled:cursor-not-allowed"
                      >
                        <option value="">None</option>
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-gray-400">→ {row.breakStart ? addOneHour(row.breakStart) : row.breakEnd || '—'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Max bookings per day</h3>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={draft.dailyCapacity}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  dailyCapacity: Number(e.target.value),
                }))
              }
              className="mt-2 w-full accent-[#E05C2A]"
            />
            <p className="mt-1 text-sm text-gray-700">{draft.dailyCapacity} appointments</p>
          </section>

          <section className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Vacation / days off</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
              />
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-semibold hover:bg-gray-50"
                onClick={() => {
                  if (!dateInput) return
                  const k = dateInput.slice(0, 10)
                  if (draft.blockedDates.includes(k)) return
                  setDraft((d) => ({ ...d, blockedDates: [...d.blockedDates, k].sort() }))
                  setDateInput('')
                }}
              >
                + Block this date
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {draft.blockedDates.map((iso) => (
                <span
                  key={iso}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
                >
                  {new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  <button
                    type="button"
                    className="text-gray-500 hover:text-red-600"
                    aria-label="Remove"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        blockedDates: d.blockedDates.filter((x) => x !== iso),
                      }))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>
        </div>
        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex w-full items-center justify-center rounded-xl bg-[#E05C2A] py-3 text-sm font-bold text-white transition hover:bg-[#c94f24] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save schedule'}
          </button>
        </div>
      </aside>
    </div>
  )
}
