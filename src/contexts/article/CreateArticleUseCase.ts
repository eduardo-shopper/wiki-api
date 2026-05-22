import { Article, CreateArticleInput } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

export class CreateArticleUseCase extends BaseUseCase<IArticleRepository, CreateArticleInput, Article> {
  private input: CreateArticleInput | null = null

  prepare(raw: unknown): void {
    const body = (raw ?? {}) as Record<string, unknown>
    if (!body.title || typeof body.title !== 'string')
      throw new BadRequestError('Missing required field: title')
    if (!body.content || typeof body.content !== 'string')
      throw new BadRequestError('Missing required field: content')
    this.input = body as unknown as CreateArticleInput
  }

  async execute(): Promise<Article> {
    return this.repository.createArticle(this.input!)
  }
}
