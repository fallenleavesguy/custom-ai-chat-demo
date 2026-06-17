import { createElement, type FC, type PropsWithChildren, useMemo } from 'react'
import {
  RuntimeAdapterProvider,
  type ExportedMessageRepositoryItem,
  type RemoteThreadListAdapter,
  type ThreadHistoryAdapter,
  useAui,
} from '@assistant-ui/react'
import { createAssistantStream } from 'assistant-stream'
import type {
  ExportedMessageRepository,
  RemoteThreadInitializeResponse,
  RemoteThreadListResponse,
  RemoteThreadMetadata,
  ThreadMessage,
} from '@assistant-ui/core'

export type StoredThreadMetadata = {
  remoteId: string
  externalId?: string
  status: 'regular' | 'archived'
  title?: string
  custom?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

const requestJson = async <T>(input: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Mock 线程接口请求失败: ${response.status}`)
  }

  return (await response.json()) as T
}

const getMessageText = (message: ExportedMessageRepositoryItem['message']) => {
  return message.content
    .filter((part) => part.type === 'text')
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join(' ')
}

const toThreadTitle = (text: string) => {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  return normalized.length > 40 ? `${normalized.slice(0, 40)}...` : normalized
}

class RemoteThreadHistoryAdapter implements ThreadHistoryAdapter {
  private aui: ReturnType<typeof useAui>

  constructor(aui: ReturnType<typeof useAui>) {
    this.aui = aui
  }

  async load(): Promise<ExportedMessageRepository> {
    const remoteId = this.aui.threadListItem().getState().remoteId
    if (!remoteId) return { messages: [] }

    return requestJson<ExportedMessageRepository>(`/api/threads/${remoteId}/messages`)
  }

  async append(item: ExportedMessageRepositoryItem): Promise<void> {
    const threadItem = this.aui.threadListItem()
    const { remoteId } = await threadItem.initialize()

    const currentTitle = threadItem.getState().title?.trim()
    if (!currentTitle && item.message.role === 'user') {
      const nextTitle = toThreadTitle(getMessageText(item.message))
      if (nextTitle) {
        await threadItem.rename(nextTitle)
      }
    }

    await requestJson(`/api/threads/${remoteId}/messages`, {
      method: 'POST',
      body: JSON.stringify(item),
    })
  }
}

const createHistoryProvider = (): FC<PropsWithChildren> => {
  const Provider: FC<PropsWithChildren> = ({ children }) => {
    const aui = useAui()
    const history = useMemo(() => new RemoteThreadHistoryAdapter(aui), [aui])
    const adapters = useMemo(() => ({ history }), [history])

    return createElement(RuntimeAdapterProvider, { adapters, children })
  }

  return Provider
}

const renameThread = async (remoteId: string, title: string) => {
  await requestJson(`/api/threads/${remoteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}

export const createMockThreadApiAdapter = (): RemoteThreadListAdapter => ({
  unstable_Provider: createHistoryProvider(),

  list(): Promise<RemoteThreadListResponse> {
    return requestJson<RemoteThreadListResponse>('/api/threads')
  },

  initialize(threadId: string): Promise<RemoteThreadInitializeResponse> {
    return requestJson<RemoteThreadInitializeResponse>('/api/threads/init', {
      method: 'POST',
      body: JSON.stringify({ threadId }),
    })
  },

  rename(remoteId: string, newTitle: string): Promise<void> {
    return renameThread(remoteId, newTitle)
  },

  updateCustom(remoteId: string, custom: Record<string, unknown> | undefined): Promise<void> {
    return requestJson(`/api/threads/${remoteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ custom }),
    })
  },

  archive(remoteId: string): Promise<void> {
    return requestJson(`/api/threads/${remoteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'archived' }),
    })
  },

  unarchive(remoteId: string): Promise<void> {
    return requestJson(`/api/threads/${remoteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'regular' }),
    })
  },

  delete(remoteId: string): Promise<void> {
    return requestJson(`/api/threads/${remoteId}`, {
      method: 'DELETE',
    })
  },

  fetch(threadId: string): Promise<RemoteThreadMetadata> {
    return requestJson<RemoteThreadMetadata>(`/api/threads/${threadId}`)
  },

  async generateTitle(remoteId: string, messages: readonly ThreadMessage[]) {
    const thread = await requestJson<RemoteThreadMetadata>(`/api/threads/${remoteId}`)
    const existingTitle = thread.title?.trim()
    const fallbackTitle = toThreadTitle(
      messages
        .find((message) => message.role === 'user')
        ?.content.filter((part) => part.type === 'text')
        .map((part) => part.text.trim())
        .filter(Boolean)
        .join(' ') ?? '',
    )
    const title = existingTitle || fallbackTitle

    return createAssistantStream((controller) => {
      controller.appendText(title)
    })
  },
})
