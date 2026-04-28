import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar.jsx'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#F6EFE9] md:flex">
      <AdminSidebar />
      <main className="w-full flex-1 p-4 pb-24 md:p-6 md:pb-6">
        <Outlet />
      </main>
    </div>
  )
}
