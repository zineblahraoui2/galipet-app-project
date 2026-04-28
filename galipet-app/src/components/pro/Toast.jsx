import { useEffect } from 'react'

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => onDismiss?.(), 3000)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast?.message) return null

  const isError = toast.type === 'error'
  const border = isError ? 'border-red-500' : 'border-[#E05C2A]'

  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-[80] max-w-sm rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-lg transition ${border} border-l-4`}
    >
      {toast.message}
    </div>
  )
}
