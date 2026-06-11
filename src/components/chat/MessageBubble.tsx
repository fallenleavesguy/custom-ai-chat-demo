import {
  MessagePartPrimitive,
  MessagePrimitive,
  useMessage,
} from '@assistant-ui/react'
import type { AssistantMeta } from '../../assistant/protocol'
import { MarkdownText } from './MarkdownText'

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

export const MessageBubble = () => {
  const message = useMessage()
  const isUser = message.role === 'user'

  return (
    <MessagePrimitive.Root
      className={`message-row ${isUser ? 'message-row-user' : 'message-row-assistant'}`}
    >
      <div className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}>
        {!isUser ? <span className="message-role-badge">AI</span> : null}

        <MessagePrimitive.Parts>
          {({ part }) => {
            if (part.type === 'text') {
              return (
                <div className="message-text-block">
                  {isUser ? <MessagePartPrimitive.Text /> : <MarkdownText />}
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
