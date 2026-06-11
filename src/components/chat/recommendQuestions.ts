type RecommendQuestionsPayload = {
  type?: string
  title?: string
  questions?: string[]
}

const fallbackPayload: Required<RecommendQuestionsPayload> = {
  type: 'recommend_questions',
  title: '你可以继续让我处理：',
  questions: [
    '帮我把这个问题拆成 3 个可执行步骤',
    '基于刚才的答案继续展开实现细节',
    '给我一个更适合落地的下一步建议',
  ],
}

export const parseRecommendQuestionsPayload = (
  code: string,
): Required<RecommendQuestionsPayload> => {
  try {
    const parsed = JSON.parse(code) as RecommendQuestionsPayload
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.filter((item): item is string => Boolean(item?.trim()))
      : []

    return {
      type: parsed.type ?? fallbackPayload.type,
      title: parsed.title ?? fallbackPayload.title,
      questions: questions.length > 0 ? questions : fallbackPayload.questions,
    }
  } catch {
    return fallbackPayload
  }
}
