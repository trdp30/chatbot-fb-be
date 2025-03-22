import { useEffect, useRef, useState } from "react"
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentStreamingMessage])

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
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message: Message, index: number) => (
          <ChatMessage
            key={index}
            content={message.content}
            isUser={message.isUser}
            timestamp={message.timestamp}
          />
        ))}
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
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  )
} 