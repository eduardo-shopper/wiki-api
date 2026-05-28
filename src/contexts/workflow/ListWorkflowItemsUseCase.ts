import { WorkflowSessionItem } from '@entities/Workflow'
import { IWorkflowSessionRepository } from '@entities/workflow/IWorkflowSessionRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface Output { sessionId: string; items: WorkflowSessionItem[] }

export class ListWorkflowItemsUseCase extends BaseUseCase<IWorkflowSessionRepository, Output> {
  private sessionId: string | null = null

  prepare(raw: unknown): void {
    const { sessionId } = (raw ?? {}) as Record<string, unknown>
    if (!sessionId || typeof sessionId !== 'string') throw new BadRequestError('Missing required parameter: sessionId')
    this.sessionId = sessionId
  }

  async execute(): Promise<Output> {
    const items = await this.repository.listItems(this.sessionId!)
    return { sessionId: this.sessionId!, items }
  }
}
