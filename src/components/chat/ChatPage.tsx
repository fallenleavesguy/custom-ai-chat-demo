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
          <header className="chat-header">
            <div className="chat-header-main">
              <p className="chat-eyebrow">assistant-ui playground</p>
              <h1>极简聊天界面</h1>
              <div className="chat-status-row">
                <span className="chat-status-pill">Vite Mock SSE</span>
                <span className="chat-status-pill">Assistant UI Primitives</span>
                <span className="chat-status-pill">Thread List Runtime</span>
              </div>
            </div>

            <div className="chat-header-side">
              <p className="chat-subtitle">custom protocol · no shadcn</p>
              <p className="chat-subcopy">
                支持 markdown、卡片消息、以及 <code>json:chart_kline</code>{' '}
                图表块
              </p>
            </div>
          </header>

          <ChatThread key={activeThreadKey} />
        </section>
      </section>
    </main>
  )
}
