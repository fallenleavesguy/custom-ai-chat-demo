import type { IncomingMessage, ServerResponse } from 'node:http'
import type { MockChatRequest } from './src/assistant/protocol'
import {
  createMockChatResponse,
  createMockChatStreamEvents,
} from './src/mocks/mockBackend'

const readBody = async (req: NodeJS.ReadableStream) => {
  const chunks: Uint8Array[] = []

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  return Buffer.concat(chunks).toString('utf8')
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
          setTimeout(resolve, event.type === 'text-delta' ? 90 : 140)
        })
      }

      res.end()
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          message: error instanceof Error ? error.message : 'mock sse api error',
        }),
      )
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

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(response))
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          message: error instanceof Error ? error.message : 'mock api error',
        }),
      )
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
