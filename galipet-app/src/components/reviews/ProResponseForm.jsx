import { useState } from 'react'
import { api } from '../../api/client.js'

export default function ProResponseForm({ bookingId, onPosted }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    const t = text.trim()
    if (!t || busy) return
    setBusy(true)
    setErr('')
    try {
      await api.post(`/api/reviews/${bookingId}/respond`, { response: t })
      setText('')
      onPosted?.(t)
    } catch (e) {
      setErr(e?.response?.data?.error || 'Could not post response')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-2">
      <label className="text-xs font-medium text-gray-600">Post a public response</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 500))}
        rows={2}
        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        placeholder="Thank the pet owner…"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400">{text.length}/500</span>
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded-lg bg-[#E05C2A] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Posting…' : 'Post response'}
        </button>
      </div>
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
    </form>
  )
}
