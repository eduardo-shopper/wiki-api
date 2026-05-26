import { Article, ArticleStatus } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface SearchInput {
  q: string
  limit: number
  status?: ArticleStatus
}

export interface SearchSemanticOutput {
  query: string
  results: Article[]
  total: number
}

function parseQuery(q: unknown): string {
  if (!q || typeof q !== 'string' || !q.trim()) throw new BadRequestError('Missing required parameter: q')
  return q.trim()
}

function parseStatus(status: unknown): ArticleStatus | undefined {
  if (status === undefined || status === null || status === '') return undefined
  if (status !== 'draft' && status !== 'published' && status !== 'archived') {
    throw new BadRequestError('Invalid parameter: status must be draft, published, or archived')
  }
  return status
}

export class SearchSemanticUseCase extends BaseUseCase<IArticleRepository, SearchSemanticOutput> {
  private input: SearchInput | null = null

  prepare(raw: unknown): void {
    const { q, limit, status } = (raw ?? {}) as Record<string, unknown>
    this.input = { q: parseQuery(q), limit: limit ? Number(limit) : 10, status: parseStatus(status) }
  }

  async execute(): Promise<SearchSemanticOutput> {
    const { q, limit, status } = this.input!
    const results = await this.repository.searchSemantic(q, limit, status)
    return { query: q, results, total: results.length }
  }
}
