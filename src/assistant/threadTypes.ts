export type StoredThreadMetadata = {
  remoteId: string
  externalId?: string
  status: 'regular' | 'archived'
  title?: string
  custom?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
