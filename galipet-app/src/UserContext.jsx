import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { api } from './api/client.js'
import { logoutSession } from './api/auth.js'

/**
 * Current user for the UI. Populated by `POST /login` and by `GET /profile` on app load
 * (no separate profile page — same pattern as a typical MERN tutorial).
 * Shape: `{ id, name?, email }` — never the full axios body `{ ok, user }`.
 *
 * `authReady` / `ready`: true after the first `/profile` attempt finishes (success or not).
 * Same flag as many tutorials call `ready` — keeps account/login routes from flashing wrong UI.
 */
// eslint-disable-next-line react-refresh/only-export-components -- context + provider in one module
export const UserContext = createContext(null)

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get('/profile')
        const { ok, user: sessionUser } = data ?? {}
        if (!cancelled && ok && sessionUser?.email) {
          setUser(sessionUser)
        }
      } catch {
        // No session cookie, expired token, or network error — stay logged out.
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutSession()
    } catch {
      // Still clear UI if the network fails; cookie may remain until next request.
    }
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, setUser, authReady, ready: authReady, logout }),
    [user, authReady, logout],
  )

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  )
}
