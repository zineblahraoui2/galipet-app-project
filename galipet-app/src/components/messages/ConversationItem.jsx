import { avatarColorClass, serviceLabel, servicePillClasses } from '../pro/bookingUtils.js'
import { formatRelativeTime, truncatePreview } from './messageUtils.js'

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'GP'
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

function previewLine(conv, myId) {
  const lm = conv?.latestMessage
  if (!lm) return ''
  if (lm.isSystem) {
    const t = String(lm.systemType || '')
    if (t === 'booking_confirmed') return 'Booking confirmed ✓'
    if (t === 'booking_cancelled') return 'Booking cancelled'
    if (t === 'booking_completed') return 'Appointment completed ✓'
    if (t === 'reminder_24h') return '24h reminder'
    return truncatePreview(lm.text, 40)
  }
  const mine = String(lm.senderId) === String(myId)
  const body = truncatePreview(lm.text, 40)
  return mine ? `You: ${body}` : body
}

export default function ConversationItem({ conversation, active, myId, onSelect }) {
  const other = conversation?.otherUser
  const name = other?.name || 'User'
  const n = Number(conversation?.unreadCount) || 0
  const svc = conversation?.bookingContext?.serviceType

  return (
    <button
      type="button"
      onClick={() => onSelect?.(String(other?._id))}
      className={[
        'flex w-full gap-3 border-b border-gray-50 px-3 py-3 text-left transition hover:bg-gray-50',
        active ? 'border-l-[3px] border-l-[#E05C2A] bg-[#FEF3EE]' : 'border-l-[3px] border-l-transparent',
      ].join(' ')}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColorClass(name)}`}
      >
        {initials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate font-semibold text-gray-900">{name}</span>
          <span className="shrink-0 text-xs text-gray-400">
            {formatRelativeTime(conversation?.latestMessage?.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-gray-600">
          {previewLine(conversation, myId)}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          {svc ? (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${servicePillClasses(svc)}`}>
              {serviceLabel(svc)}
            </span>
          ) : (
            <span />
          )}
          {n > 0 ? (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#E05C2A] px-1 text-[10px] font-bold text-white">
              {n > 99 ? '99+' : n}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}
