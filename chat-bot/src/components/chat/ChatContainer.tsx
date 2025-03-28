import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"

interface Message {
  content: string
  isUser: boolean
  timestamp: string
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [hasStartedChat, _setHasStartedChat] = useState(false)
  const [_uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentStreamingMessage])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('http://localhost:3001/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        // const data = await response.json()
        await response.json()
        setUploadedFiles(prev => [...prev, file.name])
        
        // Add system message about successful upload
        setMessages(prev => [...prev, {
          content: `Successfully uploaded ${file.name}`,
          isUser: false,
          timestamp: new Date().toISOString()
        }])
      } catch (error) {
        console.error('Error uploading file:', error)
        setMessages(prev => [...prev, {
          content: `Failed to upload ${file.name}`,
          isUser: false,
          timestamp: new Date().toISOString()
        }])
      }
    }
  }

  const handleClearStore = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/clear-store', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to clear store')
      }

      setUploadedFiles([])
      setMessages(prev => [...prev, {
        content: 'Knowledge base cleared successfully',
        isUser: false,
        timestamp: new Date().toISOString()
      }])
    } catch (error) {
      console.error('Error clearing store:', error)
      setMessages(prev => [...prev, {
        content: 'Failed to clear knowledge base',
        isUser: false,
        timestamp: new Date().toISOString()
      }])
    }
  }

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      content,
      isUser: true,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev: Message[]) => [...prev, userMessage])
    setIsLoading(true)
    setCurrentStreamingMessage("")

    try {
      const response = await fetch("http://localhost:3001/api/ollama", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: content }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No reader available")
      }

      const decoder = new TextDecoder()
      let accumulatedResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.response) {
                accumulatedResponse += data.response
                setCurrentStreamingMessage(accumulatedResponse)
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e)
            }
          }
        }
      }

      // Add the complete AI response
      const aiMessage: Message = {
        content: accumulatedResponse,
        isUser: false,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev: Message[]) => [...prev, aiMessage])
      setCurrentStreamingMessage("")

    } catch (error) {
      console.error("Error sending message:", error)
      // Add error message
      const errorMessage: Message = {
        content: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev: Message[]) => [...prev, errorMessage])
      setCurrentStreamingMessage("")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col flex-1 flex-col relative overflow-hidden justify-center items-center"
    >
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear"
        }}
      />
      
      {/* Animated grid overlay */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px),
                           linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Welcome message */}
      <AnimatePresence>
        {!hasStartedChat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center p-4 z-10"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-center max-w-2xl w-full"
            >
              <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                Welcome to AI Chat
              </h1>
              <p className="text-gray-600 mb-8">
                Upload your documents and start a conversation with our AI assistant. The AI will use your documents to provide accurate answers!
              </p>
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept=".txt,.md,.pdf"
                  className="hidden"
                />
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                           transition-colors duration-200"
                >
                  Upload Documents
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat content */}
      <div className="relative flex flex-1 flex-col overflow-y-auto p-4 space-y-4 w-full">
        <AnimatePresence mode="popLayout">
          {messages.map((message: Message, index: number) => (
            <ChatMessage
              key={index}
              content={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
        </AnimatePresence>
        {currentStreamingMessage && (
          <ChatMessage
            content={currentStreamingMessage}
            isUser={false}
            timestamp={new Date().toISOString()}
            isStreaming={true}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area with glass effect */}
      <AnimatePresence>
        {hasStartedChat && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative p-4 backdrop-blur-md bg-white/10 border-t border-white/20 z-10 w-full"
          >
            <div className="w-full flex gap-2">
              <div className="flex-1">
                <ChatInput onSend={handleSendMessage} disabled={isLoading} />
              </div>
              <motion.button
                onClick={handleClearStore}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 
                         transition-colors duration-200"
              >
                Clear Knowledge Base
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 