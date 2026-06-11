import '@assistant-ui/react-markdown/styles/dot.css'
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown'
import { memo } from 'react'
import remarkGfm from 'remark-gfm'
import { KlineChart } from './KlineChart'

const isKlineLanguage = (className?: string) => {
  if (!className) return false

  return (
    className.includes('language-json:chart_kline') ||
    className.includes('language-chart_kline') ||
    className.includes('json:chart_kline')
  )
}

const MarkdownTextImpl = () => {
  return (
    <MarkdownTextPrimitive
      className="markdown-body"
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ children, ...props }) => (
          <pre {...props} className="markdown-pre">
            {children}
          </pre>
        ),
        code: ({ className, children, ...props }) => {
          const code = String(children ?? '').replace(/\n$/, '')

          if (isKlineLanguage(className)) {
            return (
              <div className="kline-chart-shell">
                <KlineChart code={code} />
              </div>
            )
          }

          return (
            <code {...props} className={className}>
              {children}
            </code>
          )
        },
      }}
    />
  )
}

export const MarkdownText = memo(MarkdownTextImpl)
