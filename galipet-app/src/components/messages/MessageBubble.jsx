import { formatMessageTime } from './messageUtils.js'

export default function MessageBubble({ message, isMine, showAvatar }) {
  if (message?.isSystem) return null
  const align = isMine ? 'items-end' : 'items-start'
  const bubble = isMine
    ? 'bg-[#E05C2A] text-white rounded-2xl rounded-br-sm'
    : 'rounded-2xl rounded-bl-sm border border-gray-100 bg-white text-gray-900 shadow-sm'
  const time = formatMessageTime(message?.createdAt)
  const seen = isMine && message?.readAt

  return (
    <div className={`flex w-full flex-col gap-1 ${align} ${showAvatar ? 'mt-2' : 'mt-0.5'}`}>
      <div className={`max-w-[70%] px-4 py-2 ${bubble}`}>
        <p className="whitespace-pre-wrap break-words text-sm">{message?.text}</p>
      </div>
      <div className={`flex items-center gap-1 text-[10px] text-gray-400 ${isMine ? 'justify-end pr-1' : 'pl-1'}`}>
        <span>{time}</span>
        {isMine ? (
          <span className="text-gray-400" aria-label={seen ? 'Seen' : 'Sent'}>
            {seen ? '✓✓' : '✓'}
          </span>
        ) : null}
      </div>
    </div>
  )
}
