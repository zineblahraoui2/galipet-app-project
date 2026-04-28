export default function SystemMessage({ message }) {
  const t = String(message?.systemType || '')
  let color = 'bg-gray-100 text-gray-600'
  if (t === 'booking_confirmed' || t === 'booking_completed') color = 'bg-green-50 text-green-800'
  if (t === 'booking_cancelled') color = 'bg-gray-100 text-gray-500'
  if (t === 'reminder_24h') color = 'bg-orange-50 text-orange-800'
  return (
    <div className="flex justify-center py-2">
      <span className={`rounded-full px-4 py-1.5 text-center text-xs font-medium italic ${color}`}>
        ── {message?.text || 'Update'} ──
      </span>
    </div>
  )
}
