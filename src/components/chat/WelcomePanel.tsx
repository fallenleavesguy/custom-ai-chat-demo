import {
  AuiProvider,
  Suggestions,
  ThreadPrimitive,
  useAui,
} from '@assistant-ui/react'

const welcomeSuggestions = [
  {
    title: 'K 线图表示例',
    label: '自定义图表块',
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

export const WelcomePanel = () => {
  const parentAui = useAui()
  const aui = useAui({
    suggestions: Suggestions(welcomeSuggestions),
  })

  const handleSuggestionClick = (prompt: string) => {
    parentAui.composer().setText(prompt)
    parentAui.composer().send()
  }

  return (
    <AuiProvider value={aui}>
      <section className="welcome-panel">
        <p className="welcome-kicker">本地 mock backend 已连接</p>
        <h2>这是一个自定义 assistant-ui 示例</h2>
        <p className="welcome-copy">
          底层使用 assistant-ui primitives、自定义 runtime 适配和 Vite 本地
          <code>/api/chat/stream</code> SSE 接口。消息支持 markdown、图表代码块和结构化卡片。
        </p>

        <div className="welcome-suggestions">
          <ThreadPrimitive.Suggestions>
            {({ suggestion }) => (
              <button
                key={suggestion.prompt}
                type="button"
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(suggestion.prompt)}
              >
                <span className="suggestion-title">{suggestion.title}</span>
                <span className="suggestion-label">{suggestion.label}</span>
              </button>
            )}
          </ThreadPrimitive.Suggestions>
        </div>
      </section>
    </AuiProvider>
  )
}
