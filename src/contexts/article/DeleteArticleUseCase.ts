import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface DeleteInput {
  id: number
}

export class DeleteArticleUseCase extends BaseUseCase<IArticleRepository, void> {
  private input: DeleteInput | null = null

  prepare(raw: unknown): void {
    const { id } = (raw ?? {}) as Record<string, unknown>
    const parsed = Number(id)
    if (!id || isNaN(parsed)) throw new BadRequestError('Missing or invalid parameter: id')
    this.input = { id: parsed }
  }

  async execute(): Promise<void> {
    await this.repository.deleteArticle(this.input!.id)
  }
}
