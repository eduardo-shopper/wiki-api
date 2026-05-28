import { IWorkflowSessionRepository } from '@entities/workflow/IWorkflowSessionRepository'
import { BaseUseCase } from '@interfaces/IUseCase'

interface Output { deleted: number }

export class CleanupWorkflowSessionsUseCase extends BaseUseCase<IWorkflowSessionRepository, Output> {
  prepare(_raw: unknown): void {}

  async execute(): Promise<Output> {
    const deleted = await this.repository.deleteExpired()
    return { deleted }
  }
}
