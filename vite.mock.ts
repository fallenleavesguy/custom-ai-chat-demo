import type { IncomingMessage, ServerResponse } from 'node:http'
import type { MockChatRequest } from './src/assistant/protocol'
import {
  createMockChatResponse,
  createMockChatStreamEvents,
} from './src/mocks/mockBackend'
import type { ExportedMessageRepository } from '@assistant-ui/core'
import type { StoredThreadMetadata } from './src/assistant/mockThreadApi'

const readBody = async (req: NodeJS.ReadableStream) => {
  const chunks: Uint8Array[] = []

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  return Buffer.concat(chunks).toString('utf8')
}

const sendJson = (res: ServerResponse, statusCode: number, payload: unknown) => {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

const notFound = (res: ServerResponse) => {
  sendJson(res, 404, { message: 'mock api not found' })
}

const extractThreadId = (url: string | undefined) => {
  const pathname = (url ?? '').split('?')[0]
  const matched = pathname.match(/^\/([^/]+)(?:\/(messages))?$/)
  if (!matched) return null

  return {
    threadId: decodeURIComponent(matched[1]),
    resource: matched[2] ?? null,
  }
}

const threadStore = new Map<string, StoredThreadMetadata>()
const threadMessagesStore = new Map<string, ExportedMessageRepository>()

const nowIso = () => new Date().toISOString()

const sortThreadsByUpdatedAtDesc = (threads: StoredThreadMetadata[]) => {
  return [...threads].sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  })
}

const saveThread = (thread: StoredThreadMetadata) => {
  threadStore.set(thread.remoteId, thread)
  return thread
}

const touchThread = (threadId: string, updates: Partial<StoredThreadMetadata> = {}) => {
  const thread = ensureThread(threadId)

  return saveThread({
    ...thread,
    ...updates,
    updatedAt: nowIso(),
  })
}

const getThreadMessages = (threadId: string): ExportedMessageRepository => {
  return threadMessagesStore.get(threadId) ?? { messages: [] }
}

const ensureThread = (threadId: string): StoredThreadMetadata => {
  const existing = threadStore.get(threadId)
  if (existing) return existing

  const created: StoredThreadMetadata = {
    remoteId: threadId,
    status: 'regular',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  return saveThread(created)
}

const updateThreadMessage = (
  repository: ExportedMessageRepository,
  item: ExportedMessageRepository['messages'][number],
) => {
  const nextMessages = [...repository.messages]
  const index = nextMessages.findIndex((entry) => entry.message.id === item.message.id)

  if (index >= 0) {
    nextMessages[index] = item
  } else {
    nextMessages.push(item)
  }

  return {
    ...repository,
    messages: nextMessages,
    headId: item.message.id,
  }
}

const getMessageText = (message: ExportedMessageRepository['messages'][number]['message']) => {
  return message.content
    .filter((part) => part.type === 'text')
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join(' ')
}

const toThreadTitle = (text: string) => {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return undefined
  return normalized.length > 40 ? `${normalized.slice(0, 40)}...` : normalized
}

type MiddlewareStack = {
  use: (
    route: string,
    handler: (
      req: IncomingMessage,
      res: ServerResponse,
      next: () => void,
    ) => void | Promise<void>,
  ) => void
}

const applyMockChatMiddleware = (middlewares: MiddlewareStack) => {
  middlewares.use('/api/threads', async (req, res, next) => {
    const pathname = (req.url ?? '').split('?')[0]

    if ((pathname === '' || pathname === '/') && req.method === 'GET') {
      sendJson(res, 200, {
        threads: sortThreadsByUpdatedAtDesc([...threadStore.values()]),
      })
      return
    }

    if (pathname === '/init' && req.method === 'POST') {
      try {
        const rawBody = await readBody(req)
        const payload = JSON.parse(rawBody || '{}') as { threadId?: string }
        if (!payload.threadId) {
          sendJson(res, 400, { message: 'threadId is required' })
          return
        }

        const thread = ensureThread(payload.threadId)
        sendJson(res, 200, {
          remoteId: thread.remoteId,
          externalId: thread.externalId,
        })
      } catch (error) {
        sendJson(res, 500, {
          message: error instanceof Error ? error.message : 'mock thread init error',
        })
      }
      return
    }

    const matched = extractThreadId(req.url)
    if (!matched) {
      next()
      return
    }

    const thread = threadStore.get(matched.threadId)

    if (matched.resource === 'messages') {
      if (!thread && req.method !== 'POST') {
        notFound(res)
        return
      }

      if (req.method === 'GET') {
        sendJson(res, 200, getThreadMessages(matched.threadId))
        return
      }

      if (req.method === 'POST') {
        try {
          const rawBody = await readBody(req)
          const item = JSON.parse(rawBody || '{}') as ExportedMessageRepository['messages'][number]
          const currentThread = ensureThread(matched.threadId)
          const nextTitle =
            !currentThread.title && item.message.role === 'user'
              ? toThreadTitle(getMessageText(item.message))
              : undefined
          touchThread(matched.threadId, nextTitle ? { title: nextTitle } : {})
          const nextRepository = updateThreadMessage(getThreadMessages(matched.threadId), item)
          threadMessagesStore.set(matched.threadId, nextRepository)
          sendJson(res, 200, { ok: true })
        } catch (error) {
          sendJson(res, 500, {
            message: error instanceof Error ? error.message : 'mock thread message append error',
          })
        }
        return
      }

      next()
      return
    }

    if (!thread) {
      notFound(res)
      return
    }

    if (req.method === 'GET') {
      sendJson(res, 200, thread)
      return
    }

    if (req.method === 'PATCH') {
      try {
        const rawBody = await readBody(req)
        const payload = JSON.parse(rawBody || '{}') as Partial<StoredThreadMetadata>
        const updated = touchThread(matched.threadId, {
          ...(payload.title !== undefined ? { title: payload.title } : {}),
          ...(payload.custom !== undefined ? { custom: payload.custom } : {}),
          ...(payload.status ? { status: payload.status } : {}),
        })
        sendJson(res, 200, updated)
      } catch (error) {
        sendJson(res, 500, {
          message: error instanceof Error ? error.message : 'mock thread update error',
        })
      }
      return
    }

    if (req.method === 'DELETE') {
      threadStore.delete(matched.threadId)
      threadMessagesStore.delete(matched.threadId)
      sendJson(res, 200, { ok: true })
      return
    }

    next()
  })

  middlewares.use('/api/chat/stream', async (req, res, next) => {
    if (req.method !== 'POST') {
      next()
      return
    }

    try {
      const rawBody = await readBody(req)
      const request = JSON.parse(rawBody || '{}') as MockChatRequest
      const events = createMockChatStreamEvents(request)

      res.statusCode = 200
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')

      for (const event of events) {
        res.write(`data: ${JSON.stringify(event)}\n\n`)
        await new Promise<void>((resolve) => {
          const delay =
            event.type === 'thinking-delta'
              ? 180
              : event.type === 'text-delta'
                ? 140
                : 220

          setTimeout(resolve, delay)
        })
      }

      res.end()
    } catch (error) {
      sendJson(res, 500, {
        message: error instanceof Error ? error.message : 'mock sse api error',
      })
    }
  })

  middlewares.use('/api/chat', async (req, res, next) => {
    if (req.method !== 'POST') {
      next()
      return
    }

    try {
      const rawBody = await readBody(req)
      const request = JSON.parse(rawBody || '{}') as MockChatRequest
      const response = createMockChatResponse(request)

      sendJson(res, 200, response)
    } catch (error) {
      sendJson(res, 500, {
        message: error instanceof Error ? error.message : 'mock api error',
      })
    }
  })
}

export const mockChatApiPlugin = () => {
  return {
    name: 'mock-chat-api',
    configureServer(server: { middlewares: MiddlewareStack }) {
      applyMockChatMiddleware(server.middlewares)
    },
    configurePreviewServer(server: { middlewares: MiddlewareStack }) {
      applyMockChatMiddleware(server.middlewares)
    },
  }
}
