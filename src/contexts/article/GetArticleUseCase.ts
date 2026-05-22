import { Article, ArticleSource, ArticleTag, ArticleAsset } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError, NotFoundError } from '@util/errors/RequestErrors'

interface GetArticleInput { id: number }
export type GetArticleOutput = Article & {
  sources: ArticleSource[]
  tags: ArticleTag[]
  assets: ArticleAsset[]
}

export class GetArticleUseCase extends BaseUseCase<IArticleRepository, GetArticleInput, GetArticleOutput> {
  private input: GetArticleInput | null = null

  prepare(raw: unknown): void {
    const { id } = (raw ?? {}) as Record<string, unknown>
    const parsed = Number(id)
    if (!id || isNaN(parsed)) throw new BadRequestError('Missing or invalid parameter: id')
    this.input = { id: parsed }
  }

  async execute(): Promise<GetArticleOutput> {
    const { id } = this.input!
    const article = await this.repository.getArticleById(id)
    if (!article) throw new NotFoundError('Article not found')
    const [sources, tags, assets] = await Promise.all([
      this.repository.getArticleSources(id),
      this.repository.getArticleTags(id),
      this.repository.getArticleAssets(id),
    ])
    return { ...article, sources, tags, assets }
  }
}
