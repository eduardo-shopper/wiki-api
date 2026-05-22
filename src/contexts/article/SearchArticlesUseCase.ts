import { Article } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface SearchInput { q: string; limit: number }
export interface SearchOutput { query: string; results: Article[]; total: number }

export class SearchArticlesUseCase extends BaseUseCase<IArticleRepository, SearchInput, SearchOutput> {
  private input: SearchInput | null = null

  prepare(raw: unknown): void {
    const { q, limit } = (raw ?? {}) as Record<string, unknown>
    if (!q || typeof q !== 'string' || !q.trim())
      throw new BadRequestError('Missing required parameter: q')
    this.input = { q: q.trim(), limit: limit ? Number(limit) : 20 }
  }

  async execute(): Promise<SearchOutput> {
    const { q, limit } = this.input!
    const results = await this.repository.searchArticles(q, limit)
    return { query: q, results, total: results.length }
  }
}
