import { DevToolsModal } from "@assistant-ui/react-devtools";
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { ChatPage } from './components/chat/ChatPage'
import { usePlaygroundRuntime } from './assistant/runtime'
import './App.css'

function App() {
  const runtime = usePlaygroundRuntime()

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <DevToolsModal />
      <ChatPage />
    </AssistantRuntimeProvider>
  )
}

export default App
