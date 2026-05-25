import { Article } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface FindBySourceInput {
  sourceType: string
  refId: string
}
export interface FindBySourceOutput {
  results: Article[]
  total: number
}

export class FindBySourceUseCase extends BaseUseCase<IArticleRepository, FindBySourceOutput> {
  private input: FindBySourceInput | null = null

  prepare(raw: unknown): void {
    const { sourceType, refId } = (raw ?? {}) as Record<string, unknown>
    if (!sourceType || !refId) throw new BadRequestError('Missing required parameters: sourceType, refId')
    this.input = { sourceType: String(sourceType), refId: String(refId) }
  }

  async execute(): Promise<FindBySourceOutput> {
    const { sourceType, refId } = this.input!
    const results = await this.repository.findBySource(sourceType, refId)
    return { results, total: results.length }
  }
}
