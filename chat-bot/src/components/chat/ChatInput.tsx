import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={disabled}
          className="w-full px-4 py-3 rounded-lg bg-gray/10 backdrop-blur-sm border border-gray/20 
                   text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 
                   focus:ring-blue-500/50 focus:border-transparent transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <motion.button
          type="submit"
          disabled={!message.trim() || disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-md
                     ${message.trim() && !disabled
                       ? 'bg-blue-500 text-white hover:bg-blue-600'
                       : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                     } transition-colors duration-200`}
        >
          Send
        </motion.button>
      </motion.div>
    </form>
  )
} 