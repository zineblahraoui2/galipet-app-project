import { useState } from 'react'

const STORAGE_KEY = 'galipet_pro_quick_replies'
const DEFAULTS = [
  "I'll be there shortly 🐾",
  'Please bring vaccination records',
  'Your appointment is confirmed ✓',
  'Can we reschedule?',
  'Thank you for your visit!',
]

function readStoredQuickReplies() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) return null
    const next = parsed.map((x) => String(x || '').trim()).filter(Boolean)
    return next.length ? next : null
  } catch {
    return null
  }
}

export default function QuickReplies({ onPick }) {
  const [items] = useState(() => readStoredQuickReplies() ?? DEFAULTS)

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
      {items.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onPick?.(text)}
          className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-left text-sm text-gray-800 transition hover:border-[#E05C2A]/40 hover:bg-[#FEF3EE]"
        >
          {text}
        </button>
      ))}
    </div>
  )
}
