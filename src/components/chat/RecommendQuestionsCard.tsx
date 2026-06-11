import { useMemo } from 'react'
import { parseRecommendQuestionsPayload } from './recommendQuestions'

type RecommendQuestionsCardProps = {
  code: string
  onSelect?: (question: string) => void
}

export const RecommendQuestionsCard = ({
  code,
  onSelect,
}: RecommendQuestionsCardProps) => {
  const payload = useMemo(() => parseRecommendQuestionsPayload(code), [code])

  const handleClick = (question: string) => {
    onSelect?.(question)
  }

  return (
    <section className="recommend-card">
      <p className="recommend-card-kicker">推荐追问</p>
      <h4 className="recommend-card-title">{payload.title}</h4>

      <div className="recommend-card-list">
        {payload.questions.map((question) => (
          <button
            key={question}
            type="button"
            className="recommend-card-item"
            onClick={() => handleClick(question)}
          >
            <span className="recommend-card-arrow">↳</span>
            <span>{question}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
