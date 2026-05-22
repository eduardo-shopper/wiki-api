import { ArticleTag } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface TagInput { slug: string; name: string }
interface Input { id: number; tags: TagInput[] }

export class SetArticleTagsUseCase extends BaseUseCase<IArticleRepository, Input, ArticleTag[]> {
  private input: Input | null = null

  prepare(raw: unknown): void {
    const { id, tags } = (raw ?? {}) as Record<string, unknown>
    const parsed = Number(id)
    if (!id || isNaN(parsed)) throw new BadRequestError('Missing or invalid parameter: id')
    if (!Array.isArray(tags)) throw new BadRequestError('tags must be an array')
    for (const tag of tags) {
      if (!tag.slug || !tag.name) throw new BadRequestError('Each tag must have slug and name')
    }
    this.input = { id: parsed, tags: tags as TagInput[] }
  }

  async execute(): Promise<ArticleTag[]> {
    return this.repository.setArticleTags(this.input!.id, this.input!.tags)
  }
}
