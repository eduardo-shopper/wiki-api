import QueryBuilder from '@/database/queryBuilder'
import { Article, ArticleSource, ArticleContext, CreateArticleInput, UpdateArticleInput, AddSourceInput, ListFilters } from '@entities/Article'
import { toSlug, uniqueSlug } from '@util/slug'
import { BaseError } from '@util/errors/BaseError'

const FULLTEXT = 'MATCH(title, summary, content, keywords) AGAINST(? IN BOOLEAN MODE)'

// Maps camelCase input keys to snake_case DB columns for patch builds
const PATCH_FIELDS: Record<string, string> = {
  title: 'title',
  content: 'content',
  summary: 'summary',
  keywords: 'keywords',
  status: 'status',
  idCategory: 'id_category',
}

function parseContext(raw: unknown): ArticleContext | null {
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw as ArticleContext
}

function parseMeta(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw as Record<string, unknown>
}

function parseArticle(row: Record<string, unknown>): Article {
  return {
    id: row.id as number,
    slug: row.slug as string,
    title: row.title as string,
    summary: row.summary as string | null,
    content: row.content as string,
    keywords: row.keywords as string | null,
    context: parseContext(row.context),
    status: row.status as Article['status'],
    idCategory: row.id_category as number | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  }
}

function parseSource(row: Record<string, unknown>): ArticleSource {
  return {
    id: row.id as number,
    idArticle: row.id_article as number,
    type: row.type as ArticleSource['type'],
    refId: row.ref_id as string,
    meta: parseMeta(row.meta),
    createdAt: row.created_at as Date,
  }
}

function serializeJson(val: unknown): string | null {
  if (!val) return null
  return JSON.stringify(val)
}

function buildPatch(input: UpdateArticleInput): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const [key, col] of Object.entries(PATCH_FIELDS)) {
    const val = (input as Record<string, unknown>)[key]
    if (val !== undefined) patch[col] = val
  }
  if (input.context !== undefined) patch.context = serializeJson(input.context)
  return patch
}

const LIST_COLS = [
  'id', 'slug', 'title', 'summary', 'status', 'keywords', 'context',
  'id_category', 'created_by', 'created_at', 'updated_at',
]

async function generateSlug(title: string): Promise<string> {
  const base = toSlug(title)
  const row = await QueryBuilder('articles').where('slug', 'like', `${base}%`).count('id as cnt').first()
  const count = Number((row as { cnt: number } | undefined)?.cnt ?? 0)
  return count === 0 ? base : uniqueSlug(base, String(Date.now()))
}

export async function searchArticles(q: string, limit = 20): Promise<Article[]> {
  const rows = await QueryBuilder('articles')
    .whereRaw(FULLTEXT, [q])
    .orderByRaw(`${FULLTEXT} DESC`, [q])
    .select(LIST_COLS)
    .limit(limit)
  return rows.map(parseArticle)
}

export async function listArticles(filters: ListFilters = {}): Promise<Article[]> {
  let q = QueryBuilder('articles').select(LIST_COLS).orderBy('updated_at', 'desc').limit(50)
  if (filters.status) q = q.where('status', filters.status)
  if (filters.domain) q = q.whereRaw('JSON_EXTRACT(context, "$.domain") = ?', [filters.domain])
  if (filters.type) q = q.whereRaw('JSON_EXTRACT(context, "$.type") = ?', [filters.type])
  const rows = await q
  return rows.map(parseArticle)
}

export async function getArticleById(id: number): Promise<Article | null> {
  const row = await QueryBuilder('articles').where('id', id).first()
  return row ? parseArticle(row) : null
}

export async function findBySource(type: string, refId: string): Promise<Article[]> {
  const rows = await QueryBuilder('articles as a')
    .join('article_sources as s', 'a.id', 's.id_article')
    .where('s.type', type)
    .where('s.ref_id', refId)
    .select('a.*')
  return rows.map(parseArticle)
}

export async function createArticle(input: CreateArticleInput): Promise<Article> {
  const slug = input.slug ?? await generateSlug(input.title)
  const [id] = await QueryBuilder('articles').insert({
    slug,
    title: input.title,
    content: input.content,
    summary: input.summary ?? null,
    keywords: input.keywords ?? null,
    context: serializeJson(input.context ?? null),
    status: input.status ?? 'draft',
    id_category: input.idCategory ?? null,
    created_by: input.createdBy ?? null,
  })
  const created = await getArticleById(id)
  if (!created) throw new BaseError('Article not found after creation', 'ERR500', 'Internal error', 500)
  return created
}

export async function updateArticle(id: number, input: UpdateArticleInput): Promise<Article> {
  const patch = buildPatch(input)
  patch.updated_at = QueryBuilder.fn.now()
  await QueryBuilder('articles').where('id', id).update(patch)
  const updated = await getArticleById(id)
  if (!updated) throw new BaseError('Article not found', 'ERR404', 'Not found', 404)
  return updated
}

export async function deleteArticle(id: number): Promise<void> {
  const count = await QueryBuilder('articles').where('id', id).delete()
  if (!count) throw new BaseError('Article not found', 'ERR404', 'Not found', 404)
}

export async function getArticleSources(idArticle: number): Promise<ArticleSource[]> {
  const rows = await QueryBuilder('article_sources').where('id_article', idArticle)
  return rows.map(parseSource)
}

export async function addSource(idArticle: number, input: AddSourceInput): Promise<ArticleSource> {
  const [id] = await QueryBuilder('article_sources').insert({
    id_article: idArticle,
    type: input.type,
    ref_id: input.refId,
    meta: serializeJson(input.meta ?? null),
  })
  const row = await QueryBuilder('article_sources').where('id', id).first()
  return parseSource(row)
}

export async function removeSource(id: number): Promise<void> {
  const count = await QueryBuilder('article_sources').where('id', id).delete()
  if (!count) throw new BaseError('Source not found', 'ERR404', 'Not found', 404)
}
