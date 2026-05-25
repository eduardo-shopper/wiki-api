import { Article, CreateArticleInput } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { requireString } from '@util/validate'

export class CreateArticleUseCase extends BaseUseCase<IArticleRepository, Article> {
  private input: CreateArticleInput | null = null

  prepare(raw: unknown): void {
    const body = (raw ?? {}) as Record<string, unknown>
    requireString(body.title, 'title')
    requireString(body.content, 'content')
    this.input = body as unknown as CreateArticleInput
  }

  execute(): Promise<Article> {
    return this.repository.createArticle(this.input!)
  }
}
