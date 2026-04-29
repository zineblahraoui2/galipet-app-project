import { Outlet } from 'react-router-dom'
import Header from './components/Header.jsx'

export default function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex w-full max-w-none flex-1 flex-col px-4 pt-0 pb-6 text-left sm:px-6 sm:pt-0 sm:pb-7 lg:px-10">
        <Outlet />
      </main>
    </div>
  )
}
