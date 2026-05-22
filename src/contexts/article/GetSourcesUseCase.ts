import { ArticleSource } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface GetSourcesInput { id: number }

export class GetSourcesUseCase extends BaseUseCase<IArticleRepository, GetSourcesInput, ArticleSource[]> {
  private input: GetSourcesInput | null = null

  prepare(raw: unknown): void {
    const { id } = (raw ?? {}) as Record<string, unknown>
    const parsed = Number(id)
    if (!id || isNaN(parsed)) throw new BadRequestError('Missing or invalid parameter: id')
    this.input = { id: parsed }
  }

  async execute(): Promise<ArticleSource[]> {
    return this.repository.getArticleSources(this.input!.id)
  }
}
