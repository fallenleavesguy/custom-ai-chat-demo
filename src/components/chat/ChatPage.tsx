import { ChatThread } from './ChatThread'
import { CardMessageUI } from './CardMessageUI'

export const ChatPage = () => {
  return (
    <main className="chat-page">
      <CardMessageUI />
      <section className="chat-shell">
        <header className="chat-header">
          <div className="chat-header-main">
            <p className="chat-eyebrow">assistant-ui playground</p>
            <h1>极简聊天界面</h1>
            <div className="chat-status-row">
              <span className="chat-status-pill">Vite Mock SSE</span>
              <span className="chat-status-pill">Assistant UI Primitives</span>
              <span className="chat-status-pill">Custom Markdown Blocks</span>
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

        <ChatThread />
      </section>
    </main>
  )
}
