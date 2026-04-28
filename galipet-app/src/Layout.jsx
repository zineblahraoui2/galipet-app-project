import { Outlet } from 'react-router-dom'
import Header from './components/Header.jsx'

export default function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 text-left sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
