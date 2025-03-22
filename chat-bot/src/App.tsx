import { ChatContainer } from "./components/chat/ChatContainer"

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-4">
          <h1 className="text-2xl font-bold">AI Chat Assistant</h1>
        </div>
      </header>
      <main className="container py-4">
        <ChatContainer />
      </main>
    </div>
  )
}

export default App
