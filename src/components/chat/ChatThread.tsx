import {
  AuiIf,
  ComposerPrimitive,
  MessageByIndexProvider,
  ThreadPrimitive,
  useAui,
  useAuiState,
} from '@assistant-ui/react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'
import { Composer } from './Composer'
import { MessageBubble } from './MessageBubble'
import { WelcomePanel } from './WelcomePanel'

const VirtualizedMessages = ({
  onRecommendSelect,
}: {
  onRecommendSelect: (question: string) => void
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const messages = useAuiState((s) => s.thread.messages)
  const isRunning = useAuiState((s) => s.thread.isRunning)

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => 260,
    overscan: 2,
  })

  const latestMessageId = messages.at(-1)?.id

  useEffect(() => {
    if (!messages.length) {
      return
    }

    rowVirtualizer.scrollToIndex(messages.length - 1, {
      align: 'end',
      behavior: isRunning ? 'auto' : 'smooth',
    })
  }, [isRunning, latestMessageId, messages.length, rowVirtualizer])

  return (
    <ThreadPrimitive.Viewport className="thread-viewport" ref={viewportRef}>
      <div className="thread-stream-status">
        <span
          className={`thread-stream-dot ${isRunning ? 'thread-stream-dot-live' : ''}`}
        ></span>
        <span>{isRunning ? '正在接收 SSE 流式响应' : '等待下一条消息'}</span>
      </div>

      <AuiIf condition={(s) => s.thread.isEmpty}>
        <WelcomePanel />
      </AuiIf>

      {!messages.length ? null : (
        <div
          className="virtual-thread-list"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((item) => (
            <div
              key={messages[item.index]?.id ?? item.key}
              className="virtual-thread-row"
              data-index={item.index}
              ref={rowVirtualizer.measureElement}
              style={{ transform: `translateY(${item.start}px)` }}
            >
              <MessageByIndexProvider index={item.index}>
                <MessageBubble onRecommendSelect={onRecommendSelect} />
              </MessageByIndexProvider>
            </div>
          ))}
        </div>
      )}
    </ThreadPrimitive.Viewport>
  )
}

export const ChatThread = () => {
  const aui = useAui()
  const handleRecommendSelect = (question: string) => {
    aui.composer().setText(question)
  }

  return (
    <ThreadPrimitive.Root className="thread-root">
      <VirtualizedMessages onRecommendSelect={handleRecommendSelect} />

      <ThreadPrimitive.ViewportFooter className="thread-footer">
        <ComposerPrimitive.Root className="composer-root">
          <Composer />
        </ComposerPrimitive.Root>
      </ThreadPrimitive.ViewportFooter>
    </ThreadPrimitive.Root>
  )
}
