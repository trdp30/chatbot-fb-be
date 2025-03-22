import { motion } from 'framer-motion'

interface ChatMessageProps {
  content: string
  isUser: boolean
  timestamp: string
  isStreaming?: boolean
  key?: number
}

export function ChatMessage({ content, isUser, timestamp, isStreaming }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <motion.div
        initial={{ opacity: 0, x: isUser ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={`max-w-[80%] rounded-lg p-4 backdrop-blur-sm ${
          isUser
            ? 'bg-blue-500/90 text-white shadow-lg shadow-blue-500/20'
            : 'bg-gray-200/90 text-gray-800 shadow-lg shadow-gray-500/10'
        }`}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="whitespace-pre-wrap"
        >
          {content}
        </motion.div>
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex space-x-1 mt-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gray-500 rounded-full"
                animate={{
                  y: [0, -4, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.3 }}
          className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}
        >
          {new Date(timestamp).toLocaleTimeString()}
        </motion.div>
      </motion.div>
    </motion.div>
  )
} 