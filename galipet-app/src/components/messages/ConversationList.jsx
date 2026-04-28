import { useMemo, useState } from 'react'
import ConversationItem from './ConversationItem.jsx'

export default function ConversationList({
  conversations,
  activeConvUserId,
  myId,
  onSelect,
  listLive,
  loading,
}) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    let rows = Array.isArray(conversations) ? [...conversations] : []
    const s = q.trim().toLowerCase()
    if (s) {
      rows = rows.filter((c) => String(c?.otherUser?.name || '').toLowerCase().includes(s))
    }
    if (filter === 'unread') {
      rows = rows.filter((c) => Number(c?.unreadCount) > 0)
    }
    return rows
  }, [conversations, q, filter])

  const totalUnread = useMemo(
    () => (Array.isArray(conversations) ? conversations.reduce((a, c) => a + (Number(c?.unreadCount) || 0), 0) : 0),
    [conversations],
  )

  return (
    <div className="flex h-full min-h-0 w-full flex-col border-r border-gray-100 bg-white md:w-[320px] md:shrink-0">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
          {totalUnread > 0 ? (
            <span className="rounded-full bg-[#E05C2A] px-2 py-0.5 text-xs font-bold text-white">{totalUnread}</span>
          ) : null}
        </div>
        {listLive ? (
          <span className="text-xs text-gray-400" title="Syncing">
            ● live
          </span>
        ) : null}
      </div>
      <div className="border-b border-gray-100 px-3 py-2">
        <input
          type="search"
          placeholder="Search by name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E05C2A]"
        />
        <div className="mt-2 flex gap-2">
          {['all', 'unread'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={[
                'rounded-full px-3 py-1 text-xs font-medium transition',
                filter === k ? 'bg-[#E05C2A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ].join(' ')}
            >
              {k === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-sm text-gray-500">Loading conversations…</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">
            {conversations.length === 0 && !q.trim() && filter === 'all'
              ? 'No conversations yet — messages appear when you chat or get booking updates.'
              : 'No conversations match.'}
          </p>
        ) : (
          filtered.map((c) => (
            <ConversationItem
              key={c.conversationId}
              conversation={c}
              active={String(activeConvUserId) === String(c?.otherUser?._id)}
              myId={myId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
