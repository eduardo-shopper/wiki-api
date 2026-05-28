import { IWorkflowSessionRepository } from '@entities/workflow/IWorkflowSessionRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface Output { ok: boolean; itemId: number }

export class DoneWorkflowItemUseCase extends BaseUseCase<IWorkflowSessionRepository, Output> {
  private itemId: number | null = null

  prepare(raw: unknown): void {
    const { itemId } = (raw ?? {}) as Record<string, unknown>
    const parsed = Number(itemId)
    if (!itemId || isNaN(parsed)) throw new BadRequestError('Missing or invalid parameter: itemId')
    this.itemId = parsed
  }

  async execute(): Promise<Output> {
    await this.repository.markItemDone(this.itemId!)
    return { ok: true, itemId: this.itemId! }
  }
}
