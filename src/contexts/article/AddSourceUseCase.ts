import { ArticleSource, AddSourceInput, SourceType } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'
import { parseNumericId } from '@util/validate'

interface AddSourceRaw {
  id: number
  body: AddSourceInput
}

export class AddSourceUseCase extends BaseUseCase<IArticleRepository, ArticleSource> {
  private input: AddSourceRaw | null = null

  prepare(raw: unknown): void {
    const { id, type, refId, meta } = (raw ?? {}) as Record<string, unknown>
    if (!type) throw new BadRequestError('Missing required field: type')
    if (!refId) throw new BadRequestError('Missing required field: refId')
    this.input = {
      id: parseNumericId(id),
      body: { type: type as SourceType, refId: String(refId), meta: meta as Record<string, unknown> | undefined },
    }
  }

  execute(): Promise<ArticleSource> {
    const { id, body } = this.input!
    return this.repository.addSource(id, body)
  }
}
