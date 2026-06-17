import { RuntimeAdapterProvider, useAui } from '@assistant-ui/react'
import { useMemo, type PropsWithChildren } from 'react'
import { RemoteThreadHistoryAdapter } from './mockThreadApi'

export const MockThreadHistoryProvider = ({ children }: PropsWithChildren) => {
  const aui = useAui()
  const history = useMemo(() => new RemoteThreadHistoryAdapter(aui), [aui])
  const adapters = useMemo(() => ({ history }), [history])

  return (
    <RuntimeAdapterProvider adapters={adapters}>
      {children}
    </RuntimeAdapterProvider>
  )
}
