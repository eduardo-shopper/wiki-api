import { SourceRef, ArticleStatus } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface Input {
  q: string
  articleLimit: number
}

export interface SearchSemanticSourcesOutput {
  query: string
  sources: SourceRef[]
}

export class SearchSemanticSourcesUseCase extends BaseUseCase<IArticleRepository, SearchSemanticSourcesOutput> {
  private input: Input | null = null

  prepare(raw: unknown): void {
    const { q, limit } = (raw ?? {}) as Record<string, unknown>
    if (!q || typeof q !== 'string' || !q.trim()) throw new BadRequestError('Missing required parameter: q')
    this.input = { q: q.trim(), articleLimit: limit ? Number(limit) : 20 }
  }

  async execute(): Promise<SearchSemanticSourcesOutput> {
    const { q, articleLimit } = this.input!
    const sources = await this.repository.searchSemanticSources(q, articleLimit)
    return { query: q, sources }
  }
}
