import { useRef, useEffect } from 'react'

export default function MessageInput({
  value,
  onChange,
  onSend,
  sending,
  disabled,
}) {
  const ta = useRef(null)

  useEffect(() => {
    const el = ta.current
    if (!el) return
    el.style.height = 'auto'
    const max = 4 * 24
    el.style.height = `${Math.min(el.scrollHeight, max)}px`
  }, [value])

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend?.()
    }
  }

  const len = String(value || '').length
  const showCount = len >= 1800

  return (
    <div className="border-t border-gray-100 bg-white px-3 py-3">
      {showCount ? (
        <p className="mb-1 text-right text-xs text-gray-500">
          {len} / 2000
        </p>
      ) : null}
      <div className="flex items-end gap-2">
        <textarea
          ref={ta}
          rows={1}
          maxLength={2000}
          disabled={disabled || sending}
          placeholder="Type a message..."
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={onKeyDown}
          className="max-h-24 min-h-[44px] flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#E05C2A] focus:ring-2 focus:ring-[#E05C2A]/20 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled || sending || !String(value || '').trim()}
          onClick={() => onSend?.()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E05C2A] text-white shadow transition hover:bg-[#c94f24] disabled:opacity-40"
          aria-label="Send"
        >
          {sending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.75.75.75 0 0 0 0-1.5A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
