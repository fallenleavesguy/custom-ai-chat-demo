import { describe, expect, it } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { applyMockChatMiddleware } from './vite.mock'

type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => void | Promise<void>

const createHarness = () => {
  const handlers: Array<{ route: string; handler: Handler }> = []

  applyMockChatMiddleware({
    use(route, handler) {
      handlers.push({ route, handler })
    },
  })

  return {
    async dispatch(req: IncomingMessage, res: ServerResponse) {
      const originalUrl = req.url ?? ''
      let index = -1

      const run = async (): Promise<void> => {
        index += 1

        while (index < handlers.length) {
          const current = handlers[index]
          if (!originalUrl.startsWith(current.route)) {
            index += 1
            continue
          }

          const nextUrl = originalUrl.slice(current.route.length) || '/'
          req.url = nextUrl.startsWith('/') ? nextUrl : `/${nextUrl}`
          await current.handler(req, res, run)
          req.url = originalUrl
          return
        }

        req.url = originalUrl
      }

      await run()
    },
  }
}

const createResponse = () => {
  const headers = new Map<string, string>()
  let ended = false

  const res = {
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers.set(name.toLowerCase(), value)
    },
    end() {
      ended = true
    },
    write() {},
  } as unknown as ServerResponse

  return {
    res,
    getHeader(name: string) {
      return headers.get(name.toLowerCase())
    },
    isEnded() {
      return ended
    },
  }
}

describe('vite mock cors', () => {
  it('为 /api/threads/init 预检请求直接返回 204', async () => {
    const harness = createHarness()
    const response = createResponse()
    let nextCalled = false

    await harness.dispatch(
      {
        method: 'OPTIONS',
        url: '/api/threads/init',
      } as IncomingMessage,
      response.res,
    )

    expect(response.res.statusCode).toBe(204)
    expect(response.getHeader('access-control-allow-origin')).toBe('*')
    expect(response.isEnded()).toBe(true)
    expect(nextCalled).toBe(false)
  })

  it('为常规请求返回允许跨域头', async () => {
    const harness = createHarness()
    const response = createResponse()
    let nextCalled = false

    await harness.dispatch(
      {
        method: 'POST',
        url: '/api/chat',
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('{}')
        },
      } as unknown as IncomingMessage,
      response.res,
    )

    expect(response.getHeader('access-control-allow-origin')).toBe('*')
    expect(response.getHeader('access-control-allow-methods')).toContain('POST')
    expect(nextCalled).toBe(false)
  })

  it('为预检请求直接返回 204', async () => {
    const harness = createHarness()
    const response = createResponse()
    let nextCalled = false

    await harness.dispatch(
      {
        method: 'OPTIONS',
        url: '/api/chat',
      } as IncomingMessage,
      response.res,
    )

    expect(response.res.statusCode).toBe(204)
    expect(response.getHeader('access-control-allow-origin')).toBe('*')
    expect(response.getHeader('access-control-allow-headers')).toContain('Content-Type')
    expect(response.isEnded()).toBe(true)
    expect(nextCalled).toBe(false)
  })
})
