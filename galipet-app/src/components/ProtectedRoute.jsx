import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { UserContext } from '../UserContext.jsx'

export default function ProtectedRoute({ allowRole, children }) {
  const { user, ready } = useContext(UserContext)

  if (!ready) {
    return <p className="mt-10 text-center text-sm text-gray-500">Loading…</p>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  const role = String(user.role || 'owner').toLowerCase()
  if (allowRole && role !== allowRole) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (allowRole === 'admin') return <Navigate to="/home" replace />
    if (role === 'professional') return <Navigate to="/pro/dashboard" replace />
    return <Navigate to="/home" replace />
  }

  return children
}
