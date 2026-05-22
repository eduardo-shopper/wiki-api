import { Article, ListFilters } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'

export class ListArticlesUseCase extends BaseUseCase<IArticleRepository, ListFilters, Article[]> {
  private filters: ListFilters = {}

  prepare(raw: unknown): void {
    const { status, domain, type } = (raw ?? {}) as Record<string, unknown>
    this.filters = {
      status: status as string | undefined,
      domain: domain as string | undefined,
      type: type as string | undefined,
    }
  }

  async execute(): Promise<Article[]> {
    return this.repository.listArticles(this.filters)
  }
}
