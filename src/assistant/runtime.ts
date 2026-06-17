import {
  useLocalRuntime,
  useRemoteThreadListRuntime,
  type ChatModelAdapter,
  type SuggestionAdapter,
  type ThreadAssistantMessagePart,
} from '@assistant-ui/react'
import { useMemo } from 'react'
import type {
  AssistantCardPayload,
  AssistantMeta,
  AssistantThinkingState,
  MockChatMeta,
  MockChatStreamEvent,
} from './protocol'
import { toMockChatRequest } from './protocol'
import { createMockThreadApiAdapter } from './mockThreadApi'

const defaultSuggestions = [
  {
    title: 'K 线图表示例',
    label: '图表消息',
    prompt: '给我一段 kline 示例，顺便说明怎么扩展协议',
  },
  {
    title: 'React 学习路线',
    label: '学习建议',
    prompt: '帮我推荐三种学习 React 的方式',
  },
  {
    title: '复杂内容总结',
    label: '摘要任务',
    prompt: '把这段复杂说明总结成 3 个重点',
  },
]

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

const mockSuggestionAdapter: SuggestionAdapter = {
  async generate({ messages }) {
    const latestUser = [...messages]
      .reverse()
      .find((message) => message.role === 'user')

    if (!latestUser) {
      return defaultSuggestions
    }

    const latestText = latestUser.content
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join(' ')
      .toLowerCase()

    if (latestText.includes('react')) {
      return [
        {
          title: '继续展开 hooks',
          label: '后续追问',
          prompt: '继续讲一下 useEffect 和 useEffectEvent 的区别',
        },
        {
          title: '给一个练手项目',
          label: '实战建议',
          prompt: '给我一个适合学习 React 的小项目练习路线',
        },
      ]
    }

    if (latestText.includes('kline') || latestText.includes('k线')) {
      return [
        {
          title: '再来一个图表示例',
          label: '扩展协议',
          prompt: '再给我一个 chart_kline 的 mock 数据示例',
        },
        {
          title: '解释渲染链路',
          label: '实现细节',
          prompt: '解释一下 markdown 代码块是怎么映射成 echarts 的',
        },
      ]
    }

    return defaultSuggestions
  },
}

const useThreadRuntimeHook = () => {
  return useLocalRuntime(mockModelAdapter, {
    adapters: {
      suggestion: mockSuggestionAdapter,
    },
  })
}

export const usePlaygroundRuntime = () => {
  const adapter = useMemo(() => createMockThreadApiAdapter(), [])

  return useRemoteThreadListRuntime({
    adapter,
    runtimeHook: useThreadRuntimeHook,
  })
}
