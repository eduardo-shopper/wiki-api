import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface RemoveSourceInput {
  sourceId: number
}

export class RemoveSourceUseCase extends BaseUseCase<IArticleRepository, void> {
  private input: RemoveSourceInput | null = null

  prepare(raw: unknown): void {
    const { sourceId } = (raw ?? {}) as Record<string, unknown>
    const parsed = Number(sourceId)
    if (!sourceId || isNaN(parsed)) throw new BadRequestError('Missing or invalid parameter: sourceId')
    this.input = { sourceId: parsed }
  }

  async execute(): Promise<void> {
    await this.repository.removeSource(this.input!.sourceId)
  }
}
