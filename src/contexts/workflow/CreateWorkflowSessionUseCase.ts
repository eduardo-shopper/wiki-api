import { WorkflowSession } from '@entities/Workflow'
import { IWorkflowSessionRepository } from '@entities/workflow/IWorkflowSessionRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface Input {
  step: string
  items: Record<string, unknown>[]
  ttlHours?: number
}

export class CreateWorkflowSessionUseCase extends BaseUseCase<IWorkflowSessionRepository, WorkflowSession> {
  private input: Input | null = null

  prepare(raw: unknown): void {
    const { step, items, ttlHours } = (raw ?? {}) as Record<string, unknown>
    if (!step || typeof step !== 'string') throw new BadRequestError('Missing required parameter: step')
    if (!Array.isArray(items)) throw new BadRequestError('Missing required parameter: items (must be array)')
    this.input = { step, items: items as Record<string, unknown>[], ttlHours: ttlHours ? Number(ttlHours) : undefined }
  }

  async execute(): Promise<WorkflowSession> {
    // lazy cleanup before creating a new session
    await this.repository.deleteExpired()
    return this.repository.create(this.input!)
  }
}
