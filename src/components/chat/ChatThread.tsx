import {
  AuiIf,
  ComposerPrimitive,
  ThreadPrimitive,
  useAui,
  useAuiState,
} from '@assistant-ui/react'
import { Composer } from './Composer'
import { MessageBubble } from './MessageBubble'
import { WelcomePanel } from './WelcomePanel'

export const ChatThread = () => {
  const aui = useAui()
  const isRunning = useAuiState((s) => s.thread.isRunning)
  const handleRecommendSelect = (question: string) => {
    aui.composer().setText(question)
  }

  return (
    <ThreadPrimitive.Root className="thread-root">
      <ThreadPrimitive.Viewport className="thread-viewport">
        <div className="thread-stream-status">
          <span
            className={`thread-stream-dot ${isRunning ? 'thread-stream-dot-live' : ''}`}
          ></span>
          <span>{isRunning ? '正在接收 SSE 流式响应' : '等待下一条消息'}</span>
        </div>

        <AuiIf condition={(s) => s.thread.isEmpty}>
          <WelcomePanel />
        </AuiIf>

        <ThreadPrimitive.Messages>
          {({ message }) => (
            <MessageBubble
              key={message.id}
              onRecommendSelect={handleRecommendSelect}
            />
          )}
        </ThreadPrimitive.Messages>
      </ThreadPrimitive.Viewport>

      <ThreadPrimitive.ViewportFooter className="thread-footer">
        <ComposerPrimitive.Root className="composer-root">
          <Composer />
        </ComposerPrimitive.Root>
      </ThreadPrimitive.ViewportFooter>
    </ThreadPrimitive.Root>
  )
}
