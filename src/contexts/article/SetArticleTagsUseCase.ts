import { ArticleTag } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'
import { parseNumericId } from '@util/validate'

interface TagInput {
  slug: string
  name: string
}
interface Input {
  id: number
  tags: TagInput[]
}

function parseTags(tags: unknown): TagInput[] {
  if (!Array.isArray(tags)) throw new BadRequestError('tags must be an array')
  for (const tag of tags) {
    if (!tag.slug || !tag.name) throw new BadRequestError('Each tag must have slug and name')
  }
  return tags as TagInput[]
}

export class SetArticleTagsUseCase extends BaseUseCase<IArticleRepository, ArticleTag[]> {
  private input: Input | null = null

  prepare(raw: unknown): void {
    const { id, tags } = (raw ?? {}) as Record<string, unknown>
    this.input = { id: parseNumericId(id), tags: parseTags(tags) }
  }

  execute(): Promise<ArticleTag[]> {
    return this.repository.setArticleTags(this.input!.id, this.input!.tags)
  }
}
