import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAuiState,
} from '@assistant-ui/react'

const SidebarItem = () => {
  const isActive = useAuiState((s) => s.threadListItem.id === s.threads.mainThreadId)

  return (
    <ThreadListItemPrimitive.Root
      className={`sidebar-thread-item ${isActive ? 'sidebar-thread-item-active' : ''}`}
    >
      <ThreadListItemPrimitive.Trigger className="sidebar-thread-trigger">
        <span className="sidebar-thread-title">
          <ThreadListItemPrimitive.Title />
        </span>
        <span className="sidebar-thread-meta">{isActive ? '当前会话' : '本地 mock 历史'}</span>
      </ThreadListItemPrimitive.Trigger>

      <ThreadListItemPrimitive.Delete className="sidebar-thread-delete">
        删除
      </ThreadListItemPrimitive.Delete>
    </ThreadListItemPrimitive.Root>
  )
}

export const ChatSidebar = () => {
  const threadCount = useAuiState((s) => s.threads.threadIds.length)

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-header">
        <p className="chat-sidebar-kicker">mock workspace</p>
        <h2>聊天历史</h2>
        <p className="chat-sidebar-copy">当前使用 assistant-ui 官方线程列表 runtime，支持新建会话、本地持久化历史和会话切换。</p>
      </div>

      <ThreadListPrimitive.Root className="chat-thread-list">
        <ThreadListPrimitive.New className="chat-thread-new">
          + 新建聊天
        </ThreadListPrimitive.New>

        <div className="chat-thread-summary">
          <span>{threadCount} 个会话</span>
          <span>本地 mock</span>
        </div>

        <div className="chat-thread-items">
          <ThreadListPrimitive.Items>
            {() => <SidebarItem />}
          </ThreadListPrimitive.Items>
        </div>
      </ThreadListPrimitive.Root>
    </aside>
  )
}
