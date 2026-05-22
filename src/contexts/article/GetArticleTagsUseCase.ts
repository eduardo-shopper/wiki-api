import { ArticleTag } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface Input { id: number }

export class GetArticleTagsUseCase extends BaseUseCase<IArticleRepository, Input, ArticleTag[]> {
  private input: Input | null = null

  prepare(raw: unknown): void {
    const { id } = (raw ?? {}) as Record<string, unknown>
    const parsed = Number(id)
    if (!id || isNaN(parsed)) throw new BadRequestError('Missing or invalid parameter: id')
    this.input = { id: parsed }
  }

  async execute(): Promise<ArticleTag[]> {
    return this.repository.getArticleTags(this.input!.id)
  }
}
