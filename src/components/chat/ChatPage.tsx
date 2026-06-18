import { useAuiState } from '@assistant-ui/react'
import { ChatSidebar } from './ChatSidebar'
import { ChatThread } from './ChatThread'
import { CardMessageUI } from './CardMessageUI'

export const ChatPage = () => {
  const activeThreadKey = useAuiState((s) => s.threads.mainThreadId ?? 'new-thread')

  return (
    <main className="chat-page">
      <CardMessageUI />
      <section className="chat-shell">
        <ChatSidebar />

        <section className="chat-main">
          <ChatThread key={activeThreadKey} />
        </section>
      </section>
    </main>
  )
}
