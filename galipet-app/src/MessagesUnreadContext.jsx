import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api/client.js'
import { UserContext } from './UserContext.jsx'

// eslint-disable-next-line react-refresh/only-export-components -- context + provider in one module
export const MessagesUnreadContext = createContext({
  unreadCount: 0,
  refreshUnread: async () => {},
})

export function MessagesUnreadProvider({ children }) {
  const { user, ready } = useContext(UserContext)
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnread = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0)
      return
    }
    try {
      const { data } = await api.get('/api/messages/unread-count')
      const n = Number(data?.count)
      if (!Number.isNaN(n)) setUnreadCount(n)
    } catch {
      setUnreadCount(0)
    }
  }, [user?.id])

  useEffect(() => {
    if (!ready || !user?.id) return undefined
    const id0 = window.setTimeout(() => {
      void refreshUnread()
    }, 0)
    const t = window.setInterval(() => {
      void refreshUnread()
    }, 30000)
    return () => {
      window.clearTimeout(id0)
      window.clearInterval(t)
    }
  }, [ready, user?.id, refreshUnread])

  const safeUnread = ready && user?.id ? unreadCount : 0

  const value = useMemo(
    () => ({ unreadCount: safeUnread, refreshUnread }),
    [safeUnread, refreshUnread],
  )

  return (
    <MessagesUnreadContext.Provider value={value}>{children}</MessagesUnreadContext.Provider>
  )
}
