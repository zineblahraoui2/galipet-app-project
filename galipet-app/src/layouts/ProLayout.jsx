import { Outlet } from 'react-router-dom'
import Sidebar from '../components/pro/Sidebar.jsx'

export default function ProLayout() {
  return (
    <div className="flex min-h-svh bg-[#F6EFE9]">
      <Sidebar />
      <main className="min-w-0 w-full pb-20 p-4 md:pb-6 md:pl-[200px] md:pr-6 md:pt-6">
        <Outlet />
      </main>
    </div>
  )
}
