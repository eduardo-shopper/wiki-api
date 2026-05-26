import { Article } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface SearchInput {
  q: string
  limit: number
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

export class SearchSemanticUseCase extends BaseUseCase<IArticleRepository, SearchSemanticOutput> {
  private input: SearchInput | null = null

  prepare(raw: unknown): void {
    const { q, limit } = (raw ?? {}) as Record<string, unknown>
    this.input = { q: parseQuery(q), limit: limit ? Number(limit) : 10 }
  }

  async execute(): Promise<SearchSemanticOutput> {
    const { q, limit } = this.input!
    const results = await this.repository.searchSemantic(q, limit)
    return { query: q, results, total: results.length }
  }
}
