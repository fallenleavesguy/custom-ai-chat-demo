import { makeAssistantDataUI } from '@assistant-ui/react'
import type { AssistantCardPayload } from '../../assistant/protocol'

const toneClassName: Record<AssistantCardPayload['tone'], string> = {
  neutral: 'message-card',
  accent: 'message-card message-card-accent',
  success: 'message-card message-card-success',
}

export const CardMessageUI = makeAssistantDataUI({
  name: 'info-card',
  render: ({ data }) => {
    const payload = data as AssistantCardPayload

    return (
      <article className={toneClassName[payload.tone] ?? toneClassName.neutral}>
        <h3>{payload.title}</h3>
        <p>{payload.description}</p>
      </article>
    )
  },
})
