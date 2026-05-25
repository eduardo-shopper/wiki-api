import { ArticleAsset } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface Input {
  id: number
}

export class GetArticleAssetsUseCase extends BaseUseCase<IArticleRepository, ArticleAsset[]> {
  private input: Input | null = null

  prepare(raw: unknown): void {
    const { id } = (raw ?? {}) as Record<string, unknown>
    const parsed = Number(id)
    if (!id || isNaN(parsed)) throw new BadRequestError('Missing or invalid parameter: id')
    this.input = { id: parsed }
  }

  execute(): Promise<ArticleAsset[]> {
    return this.repository.getArticleAssets(this.input!.id)
  }
}
