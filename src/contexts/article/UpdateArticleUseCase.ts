import { Article, ArticleContext, ArticleStatus, UpdateArticleInput } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

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

export class UpdateArticleUseCase extends BaseUseCase<IArticleRepository, UpdateInput, Article> {
  private input: UpdateInput | null = null

  prepare(raw: unknown): void {
    const { id, title, content, summary, keywords, context, status, changedBy } = (raw ?? {}) as Record<string, unknown>
    const parsed = Number(id)
    if (!id || isNaN(parsed)) throw new BadRequestError('Missing or invalid parameter: id')
    this.input = {
      id: parsed,
      ...(title !== undefined && { title: title as string }),
      ...(content !== undefined && { content: content as string }),
      ...(summary !== undefined && { summary: summary as string | null }),
      ...(keywords !== undefined && { keywords: keywords as string | null }),
      ...(context !== undefined && { context: context as ArticleContext | null }),
      ...(status !== undefined && { status: status as ArticleStatus }),
      ...(changedBy !== undefined && { changedBy: changedBy as string }),
    }
  }

  async execute(): Promise<Article> {
    const { id, ...patch } = this.input!
    return this.repository.updateArticle(id, patch as UpdateArticleInput)
  }
}
