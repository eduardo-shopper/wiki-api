import { WorkflowSession, WorkflowSessionItem, CreateWorkflowSessionInput } from '@entities/Workflow'

export interface IWorkflowSessionRepository {
  create(input: CreateWorkflowSessionInput): Promise<WorkflowSession>
  nextItem(sessionId: string): Promise<WorkflowSessionItem | null>
  markItemDone(itemId: number): Promise<void>
  markItemFailed(itemId: number): Promise<void>
  listItems(sessionId: string): Promise<WorkflowSessionItem[]>
  deleteExpired(): Promise<number>
}
