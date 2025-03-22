interface ChatMessageProps {
  content: string
  isUser: boolean
  timestamp: string
  isStreaming?: boolean
  key?: number
}

export function ChatMessage({ content, isUser, timestamp, isStreaming }: ChatMessageProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        {isStreaming && (
          <div className="flex space-x-1 mt-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
        <div className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
} 