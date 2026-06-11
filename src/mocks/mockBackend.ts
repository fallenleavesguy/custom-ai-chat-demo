import type {
  MockChatRequest,
  MockChatResponse,
  MockCardPart,
  MockChatStreamEvent,
} from '../assistant/protocol'

const createCards = (message: string): MockCardPart[] => {
  const normalized = message.toLowerCase()

  if (normalized.includes('react')) {
    return [
      {
        type: 'card',
        title: '从组件心智开始',
        description: '先把组件、props、state 这三个概念打稳，再碰 hooks 会轻松很多。',
        tone: 'accent',
      },
      {
        type: 'card',
        title: '用小项目推进',
        description: '拿表单、列表过滤、异步请求这三类小功能练手，反馈会很快。',
        tone: 'neutral',
      },
      {
        type: 'card',
        title: '边写边复盘',
        description: '每做完一个功能，就回看为什么状态放这里、为什么拆成这些组件。',
        tone: 'success',
      },
    ]
  }

  if (normalized.includes('总结') || normalized.includes('summary')) {
    return [
      {
        type: 'card',
        title: '核心观点',
        description: '先提炼 1 到 2 句结论，让读者快速知道重点是什么。',
        tone: 'accent',
      },
      {
        type: 'card',
        title: '补充上下文',
        description: '再补背景、限制条件和下一步建议，避免总结只有口号没有判断。',
        tone: 'neutral',
      },
    ]
  }

  return [
    {
      type: 'card',
      title: '换个角度拆问题',
      description: '先明确目标，再列 2 到 3 个可执行方向，能明显减少回答发散。',
      tone: 'accent',
    },
    {
      type: 'card',
      title: '给出下一步',
      description: '如果你愿意，我下一轮可以把这个问题继续细化成步骤、示例或清单。',
      tone: 'neutral',
    },
  ]
}

const createLeadText = (message: string) => {
  const normalized = message.toLowerCase()

  if (!message.trim()) {
    return '你好，我已经连上本地 mock backend 了。你可以直接问我一个问题，我会用文本和卡片两种消息块一起回答。'
  }

  if (
    normalized.includes('k线') ||
    normalized.includes('kline') ||
    normalized.includes('chart')
  ) {
    return `下面这段 markdown 里包含一个自定义图表代码块，assistant-ui 文本渲染会把它识别成 ECharts K 线图：

\`\`\`json:chart_kline
{
  "title": "BTC/USDT 日线",
  "candles": [
    ["06-03", 68420, 69210, 67850, 69580],
    ["06-04", 69230, 70180, 68910, 70520],
    ["06-05", 70120, 69740, 69420, 70790],
    ["06-06", 69780, 70990, 69630, 71240],
    ["06-09", 70980, 70640, 70250, 71100],
    ["06-10", 70610, 71460, 70480, 71820]
  ]
}
\`\`\`

如果你后面让 backend 真正返回 markdown，这种结构也可以直接沿用。`
  }

  return `这是一个走自定义协议的 mock 回复。我先用一段文本回应“${message.slice(0, 48)}${message.length > 48 ? '…' : ''}”，再补几张结构化卡片，方便你确认 assistant-ui 的自定义渲染已经接通。`
}

export const createMockChatResponse = (
  request: MockChatRequest,
): MockChatResponse => {
  const message = request.message

  return {
    id: `resp_${Date.now()}`,
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: createLeadText(message),
      },
      ...createCards(message),
    ],
    meta: {
      source: 'vite-mock-api',
      model: 'mock-assistant-v1',
      latencyMs: 420 + Math.round(Math.random() * 180),
    },
  }
}

export const createMockChatStreamEvents = (
  request: MockChatRequest,
): MockChatStreamEvent[] => {
  const response = createMockChatResponse(request)
  const message = request.message.trim() || '当前问题'
  const text = response.parts.find((part) => part.type === 'text')?.text ?? ''
  const cards = response.parts.filter(
    (part): part is MockCardPart => part.type === 'card',
  )
  const chunkSize = Math.max(18, Math.ceil(text.length / 7))
  const thinkingText = `先识别用户意图：${message.slice(0, 28)}${message.length > 28 ? '…' : ''}\n正在组织回答结构，并准备需要返回的文本与卡片内容。`
  const thinkingChunkSize = Math.max(12, Math.ceil(thinkingText.length / 4))

  const events: MockChatStreamEvent[] = [
    {
      type: 'start',
      id: response.id,
      meta: response.meta,
    },
    {
      type: 'thinking-start',
      label: '正在整理回答',
    },
  ]

  for (
    let thinkingIndex = 0;
    thinkingIndex < thinkingText.length;
    thinkingIndex += thinkingChunkSize
  ) {
    events.push({
      type: 'thinking-delta',
      delta: thinkingText.slice(
        thinkingIndex,
        thinkingIndex + thinkingChunkSize,
      ),
    })
  }

  for (let index = 0; index < text.length; index += chunkSize) {
    if (index === 0) {
      events.push({
        type: 'thinking-end',
      })
    }

    events.push({
      type: 'text-delta',
      delta: text.slice(index, index + chunkSize),
    })
  }

  if (!text) {
    events.push({
      type: 'thinking-end',
    })
  }

  for (const card of cards) {
    events.push({
      type: 'card',
      card,
    })
  }

  events.push({ type: 'done' })

  return events
}
