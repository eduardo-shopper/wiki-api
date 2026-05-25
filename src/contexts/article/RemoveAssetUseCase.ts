import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface Input {
  assetId: number
}

export class RemoveAssetUseCase extends BaseUseCase<IArticleRepository, void> {
  private input: Input | null = null

  prepare(raw: unknown): void {
    const { assetId } = (raw ?? {}) as Record<string, unknown>
    const parsed = Number(assetId)
    if (!assetId || isNaN(parsed)) throw new BadRequestError('Missing or invalid parameter: assetId')
    this.input = { assetId: parsed }
  }

  execute(): Promise<void> {
    return this.repository.removeAsset(this.input!.assetId)
  }
}
