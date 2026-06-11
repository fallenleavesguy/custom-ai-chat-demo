import {
  useLocalRuntime,
  type ChatModelAdapter,
  type ThreadAssistantMessagePart,
} from '@assistant-ui/react'
import type {
  AssistantCardPayload,
  AssistantMeta,
  AssistantThinkingState,
  MockChatMeta,
  MockChatStreamEvent,
} from './protocol'
import { toMockChatRequest } from './protocol'

const toAssistantParts = (
  reasoning: string,
  text: string,
  cards: AssistantCardPayload[],
): ThreadAssistantMessagePart[] => {
  const parts: ThreadAssistantMessagePart[] = []

  if (reasoning) {
    parts.push({ type: 'reasoning', text: reasoning })
  }

  if (text) {
    parts.push({ type: 'text', text })
  }

  for (const payload of cards) {
    parts.push({
      type: 'data',
      name: 'info-card',
      data: payload,
    })
  }

  return parts
}

const parseSseEvent = (line: string): MockChatStreamEvent | null => {
  if (!line.startsWith('data:')) return null

  const payload = line.slice(5).trim()
  if (!payload) return null

  return JSON.parse(payload) as MockChatStreamEvent
}

const createMetadata = (
  meta: MockChatMeta | null,
  thinking?: AssistantThinkingState,
) => ({
  custom: {
    meta:
      meta ?? {
        source: 'vite-mock-sse',
        model: 'mock-assistant-v1',
        latencyMs: 0,
      },
    thinking:
      thinking ?? {
        active: false,
      },
  },
})

async function* streamEvents(
  response: Response,
): AsyncGenerator<{
  content: ThreadAssistantMessagePart[]
  metadata: {
    custom: {
      meta: AssistantMeta
      thinking: AssistantThinkingState
    }
  }
}> {
  if (!response.body) {
    throw new Error('SSE 响应体为空')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let reasoning = ''
  let text = ''
  const cards: AssistantCardPayload[] = []
  let meta: MockChatMeta | null = null
  let thinking: AssistantThinkingState = { active: false }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''

    for (const frame of frames) {
      const event = parseSseEvent(frame.trim())
      if (!event) continue

      if (event.type === 'start') {
        meta = event.meta
        yield {
          content: toAssistantParts(reasoning, text, cards),
          metadata: createMetadata(meta, thinking),
        }
        continue
      }

      if (event.type === 'thinking-start') {
        thinking = {
          active: true,
          label: event.label ?? '正在思考',
        }
        yield {
          content: toAssistantParts(reasoning, text, cards),
          metadata: createMetadata(meta, thinking),
        }
        continue
      }

      if (event.type === 'thinking-delta') {
        reasoning += event.delta
        yield {
          content: toAssistantParts(reasoning, text, cards),
          metadata: createMetadata(meta, thinking),
        }
        continue
      }

      if (event.type === 'thinking-end') {
        thinking = {
          ...thinking,
          active: false,
        }
        yield {
          content: toAssistantParts(reasoning, text, cards),
          metadata: createMetadata(meta, thinking),
        }
        continue
      }

      if (event.type === 'text-delta') {
        text += event.delta
        yield {
          content: toAssistantParts(reasoning, text, cards),
          metadata: createMetadata(meta, thinking),
        }
        continue
      }

      if (event.type === 'card') {
        cards.push({
          title: event.card.title,
          description: event.card.description,
          tone: event.card.tone ?? 'neutral',
        })
        yield {
          content: toAssistantParts(reasoning, text, cards),
          metadata: createMetadata(meta, thinking),
        }
      }
    }
  }

  yield {
    content: toAssistantParts(reasoning, text, cards),
    metadata: createMetadata(meta, thinking),
  }
}

const mockModelAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const request = toMockChatRequest(messages)

    const result = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: abortSignal,
    })

    if (!result.ok) {
      throw new Error(`Mock SSE API 请求失败: ${result.status}`)
    }

    yield* streamEvents(result)
  },
}

export const usePlaygroundRuntime = () => {
  return useLocalRuntime(mockModelAdapter)
}
