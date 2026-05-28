import { WorkflowSessionItem } from '@entities/Workflow'
import { IWorkflowSessionRepository } from '@entities/workflow/IWorkflowSessionRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface Output {
  item: WorkflowSessionItem | null
  done: boolean
}

export class NextWorkflowItemUseCase extends BaseUseCase<IWorkflowSessionRepository, Output> {
  private sessionId: string | null = null

  prepare(raw: unknown): void {
    const { sessionId } = (raw ?? {}) as Record<string, unknown>
    if (!sessionId || typeof sessionId !== 'string') throw new BadRequestError('Missing required parameter: sessionId')
    this.sessionId = sessionId
  }

  async execute(): Promise<Output> {
    const item = await this.repository.nextItem(this.sessionId!)
    return { item, done: item === null }
  }
}
