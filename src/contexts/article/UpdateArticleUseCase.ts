import { Article, ArticleContext, ArticleStatus, UpdateArticleInput } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { parseNumericId } from '@util/validate'

interface UpdateInput {
  id: number
  title?: string
  content?: string
  summary?: string | null
  keywords?: string | null
  context?: ArticleContext | null
  status?: ArticleStatus
  changedBy?: string
}

export class UpdateArticleUseCase extends BaseUseCase<IArticleRepository, Article> {
  private input: UpdateInput | null = null

  prepare(raw: unknown): void {
    const body = (raw ?? {}) as Record<string, unknown>
    this.input = {
      id: parseNumericId(body.id),
      title: body.title as string | undefined,
      content: body.content as string | undefined,
      summary: body.summary as string | null | undefined,
      keywords: body.keywords as string | null | undefined,
      context: body.context as ArticleContext | null | undefined,
      status: body.status as ArticleStatus | undefined,
      changedBy: body.changedBy as string | undefined,
    }
  }

  execute(): Promise<Article> {
    const { id, ...patch } = this.input!
    return this.repository.updateArticle(id, patch as UpdateArticleInput)
  }
}
