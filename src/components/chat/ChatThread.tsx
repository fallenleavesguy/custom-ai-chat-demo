import {
  AuiIf,
  ComposerPrimitive,
  ThreadPrimitive,
  useAui,
} from '@assistant-ui/react'
import { Composer } from './Composer'
import { MessageBubble } from './MessageBubble'
import { WelcomePanel } from './WelcomePanel'

export const ChatThread = () => {
  const aui = useAui()
  const handleRecommendSelect = (question: string) => {
    aui.composer().setText(question)
  }

  return (
    <ThreadPrimitive.Root className="thread-root">
      <ThreadPrimitive.Viewport className="thread-viewport">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <WelcomePanel />
        </AuiIf>

        <ThreadPrimitive.Messages>
          {({ message }) => (
            <MessageBubble
              key={message.id}
              onRecommendSelect={handleRecommendSelect}
            />
          )}
        </ThreadPrimitive.Messages>
      </ThreadPrimitive.Viewport>

      <ThreadPrimitive.ViewportFooter className="thread-footer">
        <ComposerPrimitive.Root className="composer-root">
          <Composer />
        </ComposerPrimitive.Root>
      </ThreadPrimitive.ViewportFooter>
    </ThreadPrimitive.Root>
  )
}
