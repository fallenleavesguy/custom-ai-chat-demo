import {
  useAui,
  MessagePartPrimitive,
  MessagePrimitive,
  useMessage,
} from '@assistant-ui/react'
import type {
  AssistantMeta,
  AssistantThinkingState,
} from '../../assistant/protocol'
import { StreamingMarkdown } from './StreamingMarkdown'

const MessageMeta = () => {
  const message = useMessage()
  const meta = message.metadata.custom.meta as AssistantMeta | undefined

  if (!meta || message.role !== 'assistant') {
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
  const message = useMessage()
  const thinking = message.metadata.custom.thinking as
    | AssistantThinkingState
    | undefined

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

export const MessageBubble = () => {
  const aui = useAui()
  const message = useMessage()
  const isUser = message.role === 'user'
  const thinking = message.metadata.custom.thinking as
    | AssistantThinkingState
    | undefined
  const showThinkingPlaceholder =
    !isUser &&
    thinking?.active &&
    !message.content.some((part) => part.type === 'reasoning')

  const handleRecommendSelect = (question: string) => {
    aui.composer().setText(question)
  }

  return (
    <MessagePrimitive.Root
      className={`message-row ${isUser ? 'message-row-user' : 'message-row-assistant'}`}
    >
      <div
        className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}
      >
        {!isUser ? <span className="message-role-badge">AI</span> : null}

        {showThinkingPlaceholder ? (
          <section className="reasoning-block">
            <header className="reasoning-header">
              <span className="reasoning-title">
                {thinking?.label ?? '正在思考'}
              </span>
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
                      onRecommendSelect={handleRecommendSelect}
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
