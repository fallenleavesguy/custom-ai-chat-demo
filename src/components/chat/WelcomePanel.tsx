import { useAui } from '@assistant-ui/react'

const suggestions = [
  '给我一段 kline 示例，顺便说明怎么扩展协议',
  '帮我推荐三种学习 React 的方式',
  '把这段复杂说明总结成 3 个重点',
]

export const WelcomePanel = () => {
  const aui = useAui()

  const handleSuggestionClick = (value: string) => {
    aui.composer().setText(value)
    aui.composer().send()
  }

  return (
    <section className="welcome-panel">
      <p className="welcome-kicker">本地 mock backend 已连接</p>
      <h2>这是一个自定义 assistant-ui 示例</h2>
      <p className="welcome-copy">
        底层使用 assistant-ui primitives、自定义 runtime 适配和 Vite 本地
        <code>/api/chat/stream</code> SSE 接口。消息支持 markdown、图表代码块和结构化卡片。
      </p>

      <div className="welcome-suggestions">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="suggestion-chip"
            onClick={() => handleSuggestionClick(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  )
}
