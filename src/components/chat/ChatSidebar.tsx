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
      <ThreadListPrimitive.Root className="chat-thread-list">
        <ThreadListPrimitive.New className="chat-thread-new">
          + 新建聊天
        </ThreadListPrimitive.New>

        <div className="chat-thread-summary">
          <span>{threadCount} 个会话</span>
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
