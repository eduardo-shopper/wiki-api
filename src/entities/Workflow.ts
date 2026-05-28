export type WorkflowSessionStatus = 'active' | 'completed' | 'failed'
export type WorkflowItemStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface WorkflowSession {
  id: string
  step: string
  status: WorkflowSessionStatus
  total: number
  expiresAt: Date
  createdAt: Date
}

export interface WorkflowSessionItem {
  id: number
  sessionId: string
  payload: Record<string, unknown>
  status: WorkflowItemStatus
  createdAt: Date
  updatedAt: Date
}

export interface CreateWorkflowSessionInput {
  step: string
  items: Record<string, unknown>[]
  ttlHours?: number
}
