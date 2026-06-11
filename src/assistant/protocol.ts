import type { ThreadMessage } from '@assistant-ui/react'

export type MockCardTone = 'neutral' | 'accent' | 'success'

export type MockCardPart = {
  type: 'card'
  title: string
  description: string
  tone?: MockCardTone
}

export type MockTextPart = {
  type: 'text'
  text: string
}

export type MockResponsePart = MockTextPart | MockCardPart

export type MockChatRequestMessage = {
  role: 'user' | 'assistant' | 'system'
  parts: MockTextPart[]
}

export type MockChatRequest = {
  message: string
  history: MockChatRequestMessage[]
}

export type MockChatMeta = {
  source: string
  model: string
  latencyMs: number
}

export type MockChatResponse = {
  id: string
  role: 'assistant'
  parts: MockResponsePart[]
  meta: MockChatMeta
}

export type MockChatStreamEvent =
  | {
      type: 'start'
      id: string
      meta: MockChatMeta
    }
  | {
      type: 'thinking-start'
      label?: string
    }
  | {
      type: 'thinking-delta'
      delta: string
    }
  | {
      type: 'thinking-end'
    }
  | {
      type: 'text-delta'
      delta: string
    }
  | {
      type: 'card'
      card: MockCardPart
    }
  | {
      type: 'done'
    }

export type AssistantMeta = MockChatMeta
export type AssistantThinkingState = {
  active: boolean
  label?: string
}

export type AssistantCardPayload = {
  title: string
  description: string
  tone: MockCardTone
}

const isTextPart = (
  part: ThreadMessage['content'][number],
): part is { type: 'text'; text: string } => {
  return part.type === 'text'
}

export const toMockChatRequest = (
  messages: readonly ThreadMessage[],
): MockChatRequest => {
  const history = messages
    .filter((message) => message.role !== 'system')
    .map<MockChatRequestMessage>((message) => ({
      role: message.role,
      parts: message.content.filter(isTextPart).map((part) => ({
        type: 'text',
        text: part.text,
      })),
    }))

  const latestUserMessage = [...history]
    .reverse()
    .find((message) => message.role === 'user')

  return {
    message:
      latestUserMessage?.parts.map((part) => part.text).join('\n').trim() ?? '',
    history,
  }
}
