import '@assistant-ui/react-markdown/styles/dot.css'
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown'
import { memo } from 'react'
import remarkGfm from 'remark-gfm'
import { KlineChart } from './KlineChart'
import { RecommendQuestionsCard } from './RecommendQuestionsCard'

const isKlineLanguage = (className?: string) => {
  if (!className) return false

  return (
    className.includes('language-json:chart_kline') ||
    className.includes('language-chart_kline') ||
    className.includes('json:chart_kline')
  )
}

const isRecommendQuestionsLanguage = (className?: string) => {
  if (!className) return false

  return (
    className.includes('language-json:recommend_questions') ||
    className.includes('language-recommend_questions') ||
    className.includes('json:recommend_questions')
  )
}

const customFenceStartPattern =
  /```(?:json:chart_kline|chart_kline|json:recommend_questions|recommend_questions)\s*/g

const stripIncompleteCustomFence = (text: string) => {
  let cursor = 0

  while (cursor < text.length) {
    customFenceStartPattern.lastIndex = cursor
    const match = customFenceStartPattern.exec(text)

    if (!match || match.index < cursor) {
      break
    }

    const closeIndex = text.indexOf('```', customFenceStartPattern.lastIndex)
    if (closeIndex === -1) {
      return text.slice(0, match.index).trimEnd()
    }

    cursor = closeIndex + 3
  }

  return text
}

type MarkdownTextProps = {
  preprocess?: (text: string) => string
  onRecommendSelect?: (question: string) => void
}

const MarkdownTextImpl = ({
  preprocess,
  onRecommendSelect,
}: MarkdownTextProps) => {
  const mergedPreprocess = (text: string) => {
    const processed = preprocess ? preprocess(text) : text
    return stripIncompleteCustomFence(processed)
  }

  return (
    <MarkdownTextPrimitive
      className="markdown-body"
      remarkPlugins={[remarkGfm]}
      preprocess={mergedPreprocess}
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

          if (isRecommendQuestionsLanguage(className)) {
            return (
              <div className="recommend-card-shell">
                <RecommendQuestionsCard
                  code={code}
                  onSelect={onRecommendSelect}
                />
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
