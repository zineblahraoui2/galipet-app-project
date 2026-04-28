import { useEffect, useRef, useState } from 'react'
import { FaArrowLeft } from 'react-icons/fa'
import { avatarColorClass } from '../pro/bookingUtils.js'
import BookingContextCard from './BookingContextCard.jsx'
import MessageBubble from './MessageBubble.jsx'
import PetInfoCard from './PetInfoCard.jsx'
import SystemMessage from './SystemMessage.jsx'
import { groupMessagesByDate, shouldShowAvatar } from './messageUtils.js'

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

function apiOrigin() {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
}

function avatarSrc(avatar) {
  const a = String(avatar || '').trim()
  if (!a) return null
  if (a.startsWith('http')) return a
  return `${apiOrigin()}${a.startsWith('/') ? '' : '/'}${a}`
}

export default function MessageThread({
  otherUser,
  bookingContext,
  threadBookings,
  focusBookingId,
  petInfo,
  messages,
  myId,
  isPro,
  mobileShowBack,
  onBack,
  onBookingFocusChange,
  onBookingUpdated,
  threadLive,
  children,
}) {
  const bottomRef = useRef(null)
  const bookingAnchorRef = useRef(null)
  const scrollRef = useRef(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages?.length])

  const lastAt = messages?.length ? messages[messages.length - 1]?.createdAt : null
  useEffect(() => {
    const bump = () => setNowMs(Date.now())
    const t0 = window.setTimeout(bump, 0)
    const id = window.setInterval(bump, 30_000)
    return () => {
      window.clearTimeout(t0)
      window.clearInterval(id)
    }
  }, [lastAt])

  const name = otherUser?.name || 'Chat'
  const specialty = otherUser?.specialty
  const recent =
    lastAt && nowMs - new Date(lastAt).getTime() < 5 * 60 * 1000

  const groups = groupMessagesByDate(messages || [])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#F6EFE9]">
      <header className="flex shrink-0 items-start gap-3 border-b border-gray-100 bg-white px-3 py-3">
        {mobileShowBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mt-1 rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Back"
          >
            <FaArrowLeft />
          </button>
        ) : null}
        <div className="flex min-w-0 flex-1 gap-3">
          {avatarSrc(otherUser?.avatar) ? (
            <img
              src={avatarSrc(otherUser?.avatar)}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ${avatarColorClass(name)}`}
            >
              {initials(name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-bold text-gray-900">{name}</p>
            <p className="truncate text-xs capitalize text-gray-500">
              {specialty || otherUser?.role || ''}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          {recent ? <span className="h-2 w-2 rounded-full bg-green-500" title="Recently active" /> : null}
          {threadLive ? <span className="text-xs text-gray-400">● live</span> : null}
          {bookingContext?._id ? (
            <button
              type="button"
              title="Appointment details"
              onClick={() => bookingAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              🗓
            </button>
          ) : null}
        </div>
      </header>

      <BookingContextCard
        scrollAnchorRef={bookingAnchorRef}
        booking={bookingContext}
        threadBookings={threadBookings}
        focusBookingId={focusBookingId}
        isPro={isPro}
        onBookingFocusChange={onBookingFocusChange}
        onBookingUpdated={onBookingUpdated}
      />
      <PetInfoCard petInfo={petInfo} />

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {groups.map(({ dateLabel, messages: chunk }) => (
          <div key={dateLabel}>
            <p className="mb-3 text-center text-xs font-medium text-gray-400">{dateLabel}</p>
            <div className="flex flex-col gap-1">
              {chunk.map((m, idx) => {
                if (m.isSystem) {
                  return <SystemMessage key={m._id} message={m} />
                }
                const prev = idx > 0 ? chunk[idx - 1] : null
                const showAv = shouldShowAvatar(m, prev)
                const isMine = String(m.senderId) === String(myId)
                return (
                  <MessageBubble key={m._id} message={m} isMine={isMine} showAvatar={showAv} />
                )
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-gray-100 bg-white px-3 pt-2">
        {children}
      </div>
    </div>
  )
}
