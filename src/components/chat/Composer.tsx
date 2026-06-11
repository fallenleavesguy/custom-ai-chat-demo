import { AuiIf, ComposerPrimitive, useAuiState } from '@assistant-ui/react'

export const Composer = () => {
  const isRunning = useAuiState((s) => s.thread.isRunning)

  return (
    <div className="composer-frame">
      <div className="composer-topline">
        <span className="composer-mode-pill">Mock SSE</span>
        <span className="composer-mode-copy">支持 markdown 图表块与卡片事件</span>
      </div>

      <ComposerPrimitive.Input
        className="composer-input"
        placeholder="输入问题，试试“给我一段 kline 示例”或“总结一下 React 学习路线”..."
        rows={1}
      />

      <div className="composer-actions">
        <span className="composer-hint">Enter 发送 · Shift + Enter 换行</span>

        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel className="composer-button composer-button-ghost">
            停止
          </ComposerPrimitive.Cancel>
        </AuiIf>

        <AuiIf condition={() => !isRunning}>
          <ComposerPrimitive.Send className="composer-button">
            发送
          </ComposerPrimitive.Send>
        </AuiIf>
      </div>
    </div>
  )
}
