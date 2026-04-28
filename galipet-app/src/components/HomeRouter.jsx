import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { UserContext } from '../UserContext.jsx'
import IndexPage from '../pages/IndexPage.jsx'

/**
 * `/` entry: landing for guests; owners go to `/home`, pros to `/pro/dashboard`.
 */
export default function HomeRouter() {
  const { user, ready } = useContext(UserContext)

  if (!ready) {
    return (
      <p className="mt-10 text-center text-sm text-gray-500">Loading…</p>
    )
  }

  if (!user) {
    return <IndexPage />
  }

  const role = String(user.role || 'owner').toLowerCase()
  if (role === 'owner') return <Navigate to="/home" replace />
  if (role === 'professional') return <Navigate to="/pro/dashboard" replace />
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />

  return <Navigate to="/home" replace />
}
