import { ChatContainer } from "./components/chat/ChatContainer"

function App() {
  return (
    <div className="h-screen w-screen bg-background">
      <div className="h-full w-full flex flex-1 flex-col">
        <main className="flex flex-1">
          <ChatContainer />
        </main>
      </div>
    </div>
  )
}

export default App
