import {
  AuiProvider,
  SuggestionPrimitive,
  Suggestions,
  ThreadPrimitive,
  useAui,
} from '@assistant-ui/react'
import { useQuery } from '@tanstack/react-query'
import type { MockWelcomeSuggestion } from '../../mocks/mockBackend'

const loadWelcomeSuggestions = async (): Promise<MockWelcomeSuggestion[]> => {
  const response = await fetch('/api/chat/suggestions')

  if (!response.ok) {
    throw new Error(`suggestions 请求失败: ${response.status}`)
  }

  const payload = (await response.json()) as {
    suggestions?: MockWelcomeSuggestion[]
  }

  return payload.suggestions ?? []
}

export const WelcomePanel = () => {
  const { data: welcomeSuggestions = [], isLoading } = useQuery({
    queryKey: ['welcome-suggestions'],
    queryFn: loadWelcomeSuggestions,
    staleTime: 5 * 60 * 1000,
  })
  const suggestionsKey = welcomeSuggestions
    .map((item) => item.prompt)
    .join('|')

  return (
    <section className="welcome-panel">
      <p className="welcome-kicker">本地 mock backend 已连接</p>
      <h2>这是一个自定义 assistant-ui 示例</h2>
      <p className="welcome-copy">
        底层使用 assistant-ui primitives、自定义 runtime 适配和 Vite 本地
        <code>/api/chat/stream</code> SSE 接口。消息支持 markdown、图表代码块和结构化卡片。
      </p>

      <div className="welcome-suggestions">
        {isLoading ? <p className="welcome-copy">正在加载推荐问题...</p> : null}
        {isLoading ? null : (
          <WelcomeSuggestions
            key={suggestionsKey || 'empty-suggestions'}
            suggestions={welcomeSuggestions}
          />
        )}
      </div>
    </section>
  )
}

const WelcomeSuggestions = ({
  suggestions,
}: {
  suggestions: MockWelcomeSuggestion[]
}) => {
  const aui = useAui({
    suggestions: Suggestions(suggestions),
  })

  return (
    <AuiProvider value={aui}>
      <ThreadPrimitive.Suggestions>
        {({ suggestion }) => (
          <SuggestionPrimitive.Trigger
            key={suggestion.prompt}
            className="suggestion-chip"
            send
          >
            <span className="suggestion-title">{suggestion.title}</span>
            <span className="suggestion-label">{suggestion.label}</span>
          </SuggestionPrimitive.Trigger>
        )}
      </ThreadPrimitive.Suggestions>
    </AuiProvider>
  )
}
