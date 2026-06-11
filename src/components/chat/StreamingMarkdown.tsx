import '@assistant-ui/react-markdown/styles/dot.css'
import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { KlineChart } from './KlineChart'
import { RecommendQuestionsCard } from './RecommendQuestionsCard'

type StreamingMarkdownProps = {
  text: string
  onRecommendSelect?: (question: string) => void
}

type Segment =
  | {
      type: 'markdown'
      content: string
      key: string
    }
  | {
      type: 'chart_kline'
      content: string
      key: string
    }
  | {
      type: 'recommend_questions'
      content: string
      key: string
    }

const customBlockPattern =
  /```(json:chart_kline|chart_kline|json:recommend_questions|recommend_questions)\s*([\s\S]*?)```/g

const toSegmentType = (language: string): Segment['type'] => {
  if (
    language === 'json:recommend_questions' ||
    language === 'recommend_questions'
  ) {
    return 'recommend_questions'
  }

  return 'chart_kline'
}

const parseSegments = (text: string): Segment[] => {
  const segments: Segment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = customBlockPattern.exec(text)) !== null) {
    const [raw, language, content] = match
    const start = match.index

    if (start > lastIndex) {
      segments.push({
        type: 'markdown',
        content: text.slice(lastIndex, start),
        key: `markdown-${lastIndex}`,
      })
    }

    segments.push({
      type: toSegmentType(language),
      content: content.trim(),
      key: `${language}-${start}-${raw.length}`,
    })

    lastIndex = start + raw.length
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'markdown',
      content: text.slice(lastIndex),
      key: `markdown-${lastIndex}`,
    })
  }

  return segments
}

const MarkdownSegment = memo(({ content }: { content: string }) => {
  if (!content.trim()) {
    return null
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ children, ...props }) => (
          <pre {...props} className="markdown-pre">
            {children}
          </pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
})

const StreamingMarkdownImpl = ({
  text,
  onRecommendSelect,
}: StreamingMarkdownProps) => {
  const segments = parseSegments(text)

  return (
    <div className="markdown-body">
      {segments.map((segment) => {
        if (segment.type === 'markdown') {
          return <MarkdownSegment key={segment.key} content={segment.content} />
        }

        if (segment.type === 'chart_kline') {
          return (
            <div key={segment.key} className="kline-chart-shell">
              <KlineChart code={segment.content} />
            </div>
          )
        }

        return (
          <div key={segment.key} className="recommend-card-shell">
            <RecommendQuestionsCard
              code={segment.content}
              onSelect={onRecommendSelect}
            />
          </div>
        )
      })}
    </div>
  )
}

export const StreamingMarkdown = memo(StreamingMarkdownImpl)
