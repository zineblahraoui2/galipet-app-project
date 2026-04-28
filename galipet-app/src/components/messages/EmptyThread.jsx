import { Link } from 'react-router-dom'
import { FaPaw } from 'react-icons/fa'

export default function EmptyThread({ variant, noConversations }) {
  if (noConversations) {
    if (variant === 'pro') {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <FaPaw className="text-5xl text-gray-300" aria-hidden />
          <p className="text-lg font-semibold text-gray-800">No messages yet</p>
          <p className="max-w-sm text-sm text-gray-600">
            When owners book you, conversations will appear here.
          </p>
        </div>
      )
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <FaPaw className="text-5xl text-gray-300" aria-hidden />
        <p className="text-lg font-semibold text-gray-800">No messages yet</p>
        <p className="max-w-sm text-sm text-gray-600">
          Book a professional to start a conversation.
        </p>
        <Link
          to="/search"
          className="rounded-full bg-[#E05C2A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c94f24]"
        >
          Find a professional →
        </Link>
      </div>
    )
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <FaPaw className="text-5xl text-gray-300" aria-hidden />
      <p className="text-sm font-medium text-gray-700">Select a conversation to start chatting</p>
    </div>
  )
}
