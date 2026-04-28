import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { UserContext } from '../UserContext.jsx'
import { MessagesUnreadContext } from '../MessagesUnreadContext.jsx'
import ConversationList from '../components/messages/ConversationList.jsx'
import EmptyThread from '../components/messages/EmptyThread.jsx'
import MessageInput from '../components/messages/MessageInput.jsx'
import MessageThread from '../components/messages/MessageThread.jsx'
import QuickReplies from '../components/messages/QuickReplies.jsx'

export default function MessagesPage() {
  const { user } = useContext(UserContext)
  const { refreshUnread } = useContext(MessagesUnreadContext)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const isPro = location.pathname.startsWith('/pro/messages')
  const myId = user?.id

  const [conversations, setConversations] = useState([])
  const [activeConvUserId, setActiveConvUserId] = useState(null)
  const [manualBookingId, setManualBookingId] = useState(null)
  const [messages, setMessages] = useState([])
  const [threadMeta, setThreadMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [inputText, setInputText] = useState('')
  const [mobileView, setMobileView] = useState('list')
  const [listLive, setListLive] = useState(false)
  const [threadLive, setThreadLive] = useState(false)
  const pollListRef = useRef(null)
  const pollThreadRef = useRef(null)
  const lastMsgIdRef = useRef(null)
  const openedUrlUserRef = useRef(null)
  /** Stops thread GET polling after a 400 so the interval does not spam the API. */
  const threadPollHaltedRef = useRef(false)

  const loadConversations = useCallback(async () => {
    if (!myId) return
    try {
      const { data } = await api.get('/api/messages/conversations')
      const list = Array.isArray(data?.conversations) ? data.conversations : []
      setConversations(list)
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [myId])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!myId) return undefined
    setListLive(true)
    pollListRef.current = setInterval(loadConversations, 15000)
    return () => {
      setListLive(false)
      if (pollListRef.current) clearInterval(pollListRef.current)
    }
  }, [myId, loadConversations])

  const loadThread = useCallback(
    async (userId, explicitBookingId) => {
      const params = new URLSearchParams()
      if (explicitBookingId) params.set('bookingId', String(explicitBookingId))
      const qs = params.toString()
      const { data } = await api.get(`/api/messages/conversation/${userId}${qs ? `?${qs}` : ''}`)
      const list = Array.isArray(data?.messages) ? data.messages : []
      setMessages(list)
      lastMsgIdRef.current = list.length ? String(list[list.length - 1]._id) : null
      setManualBookingId(explicitBookingId ? String(explicitBookingId) : null)
      setThreadMeta({
        otherUser: data?.otherUser || null,
        bookingContext: data?.bookingContext || null,
        petInfo: data?.petInfo || null,
        threadBookings: Array.isArray(data?.threadBookings) ? data.threadBookings : [],
        focusBookingId: data?.focusBookingId ?? null,
      })
    },
    [],
  )

  const openConversation = useCallback(
    async (userId, bookingIdFromUrl) => {
      if (!userId) return false
      threadPollHaltedRef.current = false
      setActiveConvUserId(userId)
      setMobileView('thread')
      lastMsgIdRef.current = null
      try {
        await loadThread(userId, bookingIdFromUrl || null)
        await api.put(`/api/messages/read/${userId}`)
        setConversations((prev) =>
          prev.map((c) =>
            String(c?.otherUser?._id) === String(userId) ? { ...c, unreadCount: 0 } : c,
          ),
        )
        await refreshUnread?.()
        return true
      } catch {
        threadPollHaltedRef.current = true
        if (pollThreadRef.current) {
          clearInterval(pollThreadRef.current)
          pollThreadRef.current = null
        }
        setMessages([])
        setThreadMeta(null)
        setManualBookingId(null)
        return false
      }
    },
    [refreshUnread, loadThread],
  )

  // Open thread from ?userId= / ?bookingId= then clean the URL (must await open — otherwise replace
  // runs immediately and drops params, which breaks Strict Mode and matches "navigate with no userId").
  useEffect(() => {
    const uid = searchParams.get('userId')
    if (!uid || !myId) return undefined
    const bid = searchParams.get('bookingId')
    const openKey = `${uid}:${bid || ''}`
    if (openedUrlUserRef.current === openKey) return undefined

    let cancelled = false

    ;(async () => {
      try {
        const ok = await openConversation(uid, bid || undefined)
        if (cancelled) return
        if (!ok) return
        openedUrlUserRef.current = openKey
        const next = new URLSearchParams(searchParams.toString())
        next.delete('userId')
        next.delete('bookingId')
        navigate(
          { pathname: location.pathname, search: next.toString() ? `?${next}` : '' },
          { replace: true },
        )
      } catch {
        if (!cancelled) openedUrlUserRef.current = null
      }
    })()

    return () => {
      cancelled = true
    }
  }, [myId, searchParams, openConversation, navigate, location.pathname])

  const pollThread = useCallback(async () => {
    if (!activeConvUserId || threadPollHaltedRef.current) return
    const after = lastMsgIdRef.current
    const params = new URLSearchParams()
    if (after) params.set('after', after)
    if (manualBookingId) params.set('bookingId', manualBookingId)
    const qs = params.toString()
    const url = `/api/messages/conversation/${activeConvUserId}${qs ? `?${qs}` : ''}`
    try {
      const { data } = await api.get(url)
      const incoming = Array.isArray(data?.messages) ? data.messages : []
      if (!after) {
        setMessages(incoming)
        lastMsgIdRef.current = incoming.length ? String(incoming[incoming.length - 1]._id) : null
      } else if (incoming.length) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => String(m._id)))
          const merged = [...prev]
          for (const m of incoming) {
            if (!ids.has(String(m._id))) merged.push(m)
          }
          merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          return merged
        })
        lastMsgIdRef.current = String(incoming[incoming.length - 1]._id)
      }
      await api.put(`/api/messages/read/${activeConvUserId}`)
      await refreshUnread?.()
      if (data?.bookingContext || data?.threadBookings || data?.focusBookingId !== undefined) {
        setThreadMeta((prev) =>
          prev
            ? {
                ...prev,
                bookingContext: data.bookingContext ?? prev.bookingContext,
                threadBookings: Array.isArray(data?.threadBookings)
                  ? data.threadBookings
                  : prev.threadBookings,
                focusBookingId: data?.focusBookingId ?? prev.focusBookingId,
                petInfo: data?.petInfo ?? prev.petInfo,
              }
            : prev,
        )
      }
    } catch (err) {
      if (err?.response?.status === 400) {
        threadPollHaltedRef.current = true
        if (pollThreadRef.current) {
          clearInterval(pollThreadRef.current)
          pollThreadRef.current = null
        }
      }
    }
  }, [activeConvUserId, manualBookingId, refreshUnread])

  useEffect(() => {
    if (!activeConvUserId) return undefined
    if (threadPollHaltedRef.current) {
      setThreadLive(false)
      return undefined
    }
    setThreadLive(true)
    pollThreadRef.current = setInterval(pollThread, 10000)
    return () => {
      setThreadLive(false)
      if (pollThreadRef.current) clearInterval(pollThreadRef.current)
    }
  }, [activeConvUserId, pollThread])

  const sendMessage = useCallback(async () => {
    const text = String(inputText || '').trim()
    if (!text || sending || !activeConvUserId) return
    setSending(true)
    try {
      const bookingId = threadMeta?.bookingContext?._id || null
      const { data } = await api.post('/api/messages/send', {
        recipientId: activeConvUserId,
        text,
        bookingId,
      })
      const created = data && data._id ? data : null
      if (created) {
        setMessages((prev) => [...prev, created])
        lastMsgIdRef.current = String(created._id)
        setInputText('')
        setConversations((prev) => {
          const otherId = activeConvUserId
          const exists = prev.some((c) => String(c?.otherUser?._id) === String(otherId))
          const latestMessage = {
            text: created.text,
            createdAt: created.createdAt,
            senderId: created.senderId,
            isSystem: Boolean(created.isSystem),
            systemType: created.systemType || null,
          }
          if (exists) {
            return prev.map((c) =>
              String(c?.otherUser?._id) === String(otherId) ? { ...c, latestMessage, unreadCount: 0 } : c,
            )
          }
          return [
            {
              conversationId: `pair_${otherId}`,
              otherUser: threadMeta?.otherUser || { _id: otherId, name: 'Chat', role: 'owner' },
              latestMessage,
              unreadCount: 0,
              bookingContext: threadMeta?.bookingContext || null,
              petInfo: threadMeta?.petInfo || null,
            },
            ...prev,
          ]
        })
        loadConversations()
      }
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }, [inputText, sending, activeConvUserId, threadMeta, loadConversations])

  const noConversations = !loading && conversations.length === 0

  const listColClass = noConversations
    ? 'hidden min-h-0 md:flex md:w-[320px] md:shrink-0'
    : activeConvUserId && mobileView === 'thread'
      ? 'hidden min-h-0 md:flex md:w-[320px] md:shrink-0'
      : 'flex min-h-0 min-w-0 md:w-[320px] md:shrink-0'

  const threadColClass = noConversations
    ? 'flex min-h-0 min-w-0 flex-1 flex-col'
    : !activeConvUserId
      ? 'hidden min-h-0 min-w-0 flex-1 flex-col md:flex'
      : mobileView === 'list'
        ? 'hidden min-h-0 min-w-0 flex-1 flex-col md:flex'
        : 'flex min-h-0 min-w-0 flex-1 flex-col'

  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#EADFD6] bg-[#F6EFE9] shadow-sm md:h-[calc(100vh-7rem)]">
      <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[320px_1fr]">
        <div className={listColClass}>
          <ConversationList
            conversations={conversations}
            activeConvUserId={activeConvUserId}
            myId={myId}
            onSelect={(id) => openConversation(id)}
            listLive={listLive}
            loading={loading}
          />
        </div>

        <div className={threadColClass}>
          {activeConvUserId && threadMeta?.otherUser ? (
            <MessageThread
              otherUser={threadMeta.otherUser}
              bookingContext={threadMeta.bookingContext}
              threadBookings={threadMeta.threadBookings}
              focusBookingId={threadMeta.focusBookingId}
              petInfo={threadMeta.petInfo}
              messages={messages}
              myId={myId}
              isPro={isPro}
              mobileShowBack
              onBack={() => {
                setMobileView('list')
                setActiveConvUserId(null)
                setManualBookingId(null)
                setThreadMeta(null)
                setMessages([])
              }}
              onBookingFocusChange={(bookingId) => {
                if (!activeConvUserId || !bookingId) return
                loadThread(activeConvUserId, bookingId).catch(() => {})
              }}
              onBookingUpdated={(b) => {
                setThreadMeta((prev) => {
                  if (!prev) return prev
                  const id = String(b?._id || '')
                  const threadBookings = Array.isArray(prev.threadBookings)
                    ? prev.threadBookings.map((row) =>
                        id && String(row._id) === id
                          ? {
                              ...row,
                              status: b.status,
                              date: b.date ?? row.date,
                              timeSlot: b.timeSlot ?? row.timeSlot,
                              serviceType: b.serviceType ?? row.serviceType,
                            }
                          : row,
                      )
                    : prev.threadBookings
                  return { ...prev, bookingContext: b, threadBookings }
                })
                loadConversations()
              }}
              threadLive={threadLive}
            >
              {isPro ? <QuickReplies onPick={(t) => setInputText((prev) => (prev ? `${prev} ${t}` : t))} /> : null}
              <MessageInput
                value={inputText}
                onChange={setInputText}
                onSend={sendMessage}
                sending={sending}
                disabled={!activeConvUserId}
              />
            </MessageThread>
          ) : noConversations ? (
            <EmptyThread variant={isPro ? 'pro' : 'owner'} noConversations />
          ) : (
            <EmptyThread variant={isPro ? 'pro' : 'owner'} noConversations={false} />
          )}
        </div>
      </div>
    </div>
  )
}
