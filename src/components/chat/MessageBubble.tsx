import {
  MessagePartPrimitive,
  MessagePrimitive,
  useAuiState,
} from '@assistant-ui/react'
import type {
  AssistantMeta,
  AssistantThinkingState,
} from '../../assistant/protocol'
import { StreamingMarkdown } from './StreamingMarkdown'

type MessageBubbleProps = {
  onRecommendSelect?: (question: string) => void
}

const MessageMeta = () => {
  const role = useAuiState((s) => s.message.role)
  const meta = useAuiState(
    (s) => s.message.metadata.custom.meta as AssistantMeta | undefined,
  )

  if (!meta || role !== 'assistant') {
    return null
  }

  return (
    <footer className="message-meta">
      <span>{meta.source}</span>
      <span>{meta.model}</span>
      <span>{meta.latencyMs}ms</span>
    </footer>
  )
}

type ReasoningBlockProps = {
  text: string
}

const ReasoningBlock = ({ text }: ReasoningBlockProps) => {
  const thinking = useAuiState(
    (s) => s.message.metadata.custom.thinking as
      | AssistantThinkingState
      | undefined,
  )

  return (
    <section className="reasoning-block">
      <header className="reasoning-header">
        <span className="reasoning-title">
          {thinking?.label ?? '思考过程'}
        </span>
        {thinking?.active ? (
          <span className="reasoning-loading" aria-label="正在思考">
            <i></i>
            <i></i>
            <i></i>
          </span>
        ) : (
          <span className="reasoning-done">已完成</span>
        )}
      </header>

      <div className="reasoning-text">
        {text}
      </div>
    </section>
  )
}

export const MessageBubble = ({ onRecommendSelect }: MessageBubbleProps) => {
  const isUser = useAuiState((s) => s.message.role === 'user')
  const thinking = useAuiState(
    (s) => s.message.metadata.custom.thinking as
      | AssistantThinkingState
      | undefined,
  )
  const hasReasoningPart = useAuiState((s) =>
    s.message.content.some((part) => part.type === 'reasoning'),
  )
  const showThinkingPlaceholder =
    !isUser &&
    thinking?.active &&
    !hasReasoningPart


  return (
    <MessagePrimitive.Root
      className={`message-row ${isUser ? 'message-row-user' : 'message-row-assistant'}`}
    >
      <div
        className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}
      >
        {!isUser ? <span className="message-role-badge">AI</span> : null}

        {/* 推理部分内容还没完整时显示 */}
        {showThinkingPlaceholder ? (
          <section className="reasoning-block">
            <header className="reasoning-header">
              <span className="reasoning-title">
                {thinking?.label ?? '正在思考'}
              </span>
              {/* loading animation */}
              <span className="reasoning-loading" aria-label="正在思考">
                <i></i>
                <i></i>
                <i></i>
              </span>
            </header>
          </section>
        ) : null}

        <MessagePrimitive.Parts>
          {({ part }) => {
            if (part.type === 'reasoning') {
              return <ReasoningBlock text={part.text} />
            }

            if (part.type === 'text') {
              return (
                <div className="message-text-block">
                  {isUser ? (
                    <MessagePartPrimitive.Text />
                  ) : (
                    <StreamingMarkdown
                      text={part.text}
                      onRecommendSelect={onRecommendSelect}
                    />
                  )}
                </div>
              )
            }

            if (part.type === 'data') {
              return null
            }

            return null
          }}
        </MessagePrimitive.Parts>

        <MessageMeta />
      </div>
    </MessagePrimitive.Root>
  )
}
