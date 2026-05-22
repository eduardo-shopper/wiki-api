export type ArticleStatus = 'draft' | 'published' | 'archived'
export type ArticleType = 'technical' | 'business' | 'process' | 'glossary'
export type SourceType = 'clickup_task' | 'github_pr' | 'github_commit' | 'code_file' | 'manual'

export interface ArticleContext {
  type: ArticleType
  domain: string
  autoManaged?: boolean
  lastSyncedAt?: string | null
}

export interface Article {
  id: number
  slug: string
  title: string
  summary: string | null
  content: string
  keywords: string | null
  context: ArticleContext | null
  status: ArticleStatus
  idCategory: number | null
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ArticleSource {
  id: number
  idArticle: number
  type: SourceType
  refId: string
  meta: Record<string, unknown> | null
  createdAt: Date
}

export interface CreateArticleInput {
  title: string
  content: string
  slug?: string
  summary?: string
  keywords?: string
  context?: ArticleContext
  status?: ArticleStatus
  idCategory?: number
  createdBy?: string
}

export interface UpdateArticleInput {
  title?: string
  content?: string
  summary?: string | null
  keywords?: string | null
  context?: ArticleContext | null
  status?: ArticleStatus
  idCategory?: number | null
}

export interface AddSourceInput {
  type: SourceType
  refId: string
  meta?: Record<string, unknown>
}

export interface ListFilters {
  status?: string
  domain?: string
  type?: string
}
