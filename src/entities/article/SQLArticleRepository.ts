import QueryBuilder from '@/database/queryBuilder'
import {
  Article,
  ArticleSource,
  ArticleTag,
  ArticleAsset,
  ArticleRevision,
  ArticleContext,
  SourceRef,
  CreateArticleInput,
  UpdateArticleInput,
  AddSourceInput,
  AddAssetInput,
  ListFilters,
} from '@entities/Article'
import { toSlug, uniqueSlug } from '@util/slug'
import { NotFoundError } from '@util/errors/RequestErrors'
import { generateEmbedding, buildEmbeddingText } from '@util/embedding'
import { IArticleRepository } from './IArticleRepository'

// PostgreSQL full-text search using tsvector/tsquery.
// The GIN functional index on this same expression makes these queries fast.
const FTS_VEC = `to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(keywords,'') || ' ' || coalesce(content,''))`
const FTS_QUERY = `websearch_to_tsquery('portuguese', ?)`
const FTS_WHERE = `${FTS_VEC} @@ ${FTS_QUERY}`
const FTS_RANK = `ts_rank(${FTS_VEC}, ${FTS_QUERY})`

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
  return typeof raw === 'string' ? JSON.parse(raw) : (raw as ArticleContext)
}

function parseMeta(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>)
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

function parseTag(row: Record<string, unknown>): ArticleTag {
  return {
    id: row.id as number,
    slug: row.slug as string,
    name: row.name as string,
  }
}

function parseAsset(row: Record<string, unknown>): ArticleAsset {
  return {
    id: row.id as number,
    idArticle: row.id_article as number,
    type: row.type as ArticleAsset['type'],
    url: row.url as string,
    caption: row.caption as string | null,
    position: row.position as number,
    createdAt: row.created_at as Date,
  }
}

function parseRevision(row: Record<string, unknown>): ArticleRevision {
  return {
    id: row.id as number,
    idArticle: row.id_article as number,
    changedBy: row.changed_by as string | null,
    snapshot: parseMeta(row.snapshot) as Record<string, unknown>,
    createdAt: row.created_at as Date,
  }
}

function serializeJson(val: unknown): string | null {
  if (!val) return null
  return JSON.stringify(val)
}

function contentSnapshot(article: Article) {
  return {
    title: article.title,
    summary: article.summary,
    content: article.content,
    keywords: article.keywords,
  }
}

function buildArticleRow(input: CreateArticleInput, slug: string) {
  const { summary = null, keywords = null, status = 'draft', idCategory = null, createdBy = null } = input
  return {
    slug,
    title: input.title,
    content: input.content,
    summary,
    keywords,
    status,
    id_category: idCategory,
    created_by: createdBy,
    context: serializeJson(input.context ?? null),
  }
}

function isContentChange(input: UpdateArticleInput): boolean {
  return input.title !== undefined || input.content !== undefined || input.summary !== undefined || input.keywords !== undefined
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

const LIST_COLS = ['id', 'slug', 'title', 'summary', 'status', 'keywords', 'context', 'id_category', 'created_by', 'created_at', 'updated_at']

async function generateSlug(title: string): Promise<string> {
  const base = toSlug(title)
  const row = await QueryBuilder('articles').where('slug', 'like', `${base}%`).count('id as cnt').first()
  const count = Number((row as { cnt: string | number } | undefined)?.cnt ?? 0)
  return count === 0 ? base : uniqueSlug(base, String(Date.now()))
}

export class SQLArticleRepository implements IArticleRepository {
  async searchArticles(q: string, limit = 20, status?: Article['status']): Promise<Article[]> {
    let searchQuery = QueryBuilder('articles').whereRaw(FTS_WHERE, [q])
    if (status) searchQuery = searchQuery.where('status', status)
    const rows = await searchQuery
      .orderByRaw(`${FTS_RANK} DESC`, [q])
      .select(LIST_COLS)
      .limit(limit)
    return rows.map(parseArticle)
  }

  async searchSemantic(q: string, limit = 10, status?: Article['status']): Promise<Article[]> {
    const emb = await generateEmbedding(q)
    if (!emb) return []
    const vec = `[${emb.join(',')}]`
    let searchQuery = QueryBuilder('articles').whereNotNull('embedding')
    if (status) searchQuery = searchQuery.where('status', status)
    const rows = await searchQuery
      .orderByRaw('embedding <=> ?::vector', [vec])
      .select(LIST_COLS)
      .limit(limit)
    return rows.map(parseArticle)
  }

  async searchSemanticSources(q: string, articleLimit = 20): Promise<SourceRef[]> {
    const emb = await generateEmbedding(q)
    if (!emb) return []
    const vec = `[${emb.join(',')}]`
    const rows = await QueryBuilder('articles as a')
      .join('article_sources as s', 'a.id', 's.id_article')
      .whereNotNull('a.embedding')
      .orderByRaw('a.embedding <=> ?::vector', [vec])
      .limit(articleLimit)
      .select('s.type as source_type', 's.ref_id')
    return rows.map((r: Record<string, unknown>) => ({
      sourceType: r.source_type as SourceRef['sourceType'],
      refId: r.ref_id as string,
    }))
  }

  async listArticles(filters: ListFilters = {}): Promise<Article[]> {
    let q = QueryBuilder('articles').select(LIST_COLS).orderBy('updated_at', 'desc').limit(50)
    if (filters.status) q = q.where('status', filters.status)
    if (filters.domain) q = q.whereRaw("context->>'domain' = ?", [filters.domain])
    if (filters.type) q = q.whereRaw("context->>'type' = ?", [filters.type])
    const rows = await q
    return rows.map(parseArticle)
  }

  async getArticleById(id: number): Promise<Article | null> {
    const row = await QueryBuilder('articles').where('id', id).first()
    return row ? parseArticle(row) : null
  }

  async findBySource(type: string, refId: string): Promise<Article[]> {
    const rows = await QueryBuilder('articles as a').join('article_sources as s', 'a.id', 's.id_article').where('s.type', type).where('s.ref_id', refId).select('a.*')
    return rows.map(parseArticle)
  }

  async createArticle(input: CreateArticleInput): Promise<Article> {
    const slug = input.slug ?? (await generateSlug(input.title))
    const row: Record<string, unknown> = buildArticleRow(input, slug)
    const emb = await generateEmbedding(buildEmbeddingText(input.title, input.summary ?? null, input.keywords ?? null, input.content))
    if (emb) row.embedding = `[${emb.join(',')}]`
    const [{ id }] = await QueryBuilder('articles').insert(row).returning('id')
    return this.saveInitialRevision(id, input.createdBy ?? null)
  }

  private async saveInitialRevision(id: number, changedBy: string | null): Promise<Article> {
    const created = await this.getArticleById(id)
    if (!created) throw new NotFoundError('Article not found after creation')
    await QueryBuilder('article_revisions').insert({
      id_article: id,
      changed_by: changedBy,
      snapshot: JSON.stringify(contentSnapshot(created)),
    })
    return created
  }

  async updateArticle(id: number, input: UpdateArticleInput): Promise<Article> {
    const patch = buildPatch(input)
    patch.updated_at = QueryBuilder.fn.now()
    await QueryBuilder('articles').where('id', id).update(patch)
    const updated = await this.getArticleById(id)
    if (!updated) throw new NotFoundError('Article not found')
    if (isContentChange(input)) {
      const emb = await generateEmbedding(buildEmbeddingText(updated.title, updated.summary, updated.keywords, updated.content))
      if (emb) await QueryBuilder('articles').where('id', id).update({ embedding: `[${emb.join(',')}]` })
      await QueryBuilder('article_revisions').insert({
        id_article: id,
        changed_by: input.changedBy ?? null,
        snapshot: JSON.stringify(contentSnapshot(updated)),
      })
    }
    return updated
  }

  async deleteArticle(id: number): Promise<void> {
    const count = await QueryBuilder('articles').where('id', id).delete()
    if (!count) throw new NotFoundError('Article not found')
  }

  async getArticleSources(idArticle: number): Promise<ArticleSource[]> {
    const rows = await QueryBuilder('article_sources').where('id_article', idArticle)
    return rows.map(parseSource)
  }

  async addSource(idArticle: number, input: AddSourceInput): Promise<ArticleSource> {
    const [{ id }] = await QueryBuilder('article_sources')
      .insert({
        id_article: idArticle,
        type: input.type,
        ref_id: input.refId,
        meta: serializeJson(input.meta ?? null),
      })
      .returning('id')
    const row = await QueryBuilder('article_sources').where('id', id).first()
    return parseSource(row)
  }

  async removeSource(id: number): Promise<void> {
    const count = await QueryBuilder('article_sources').where('id', id).delete()
    if (!count) throw new NotFoundError('Source not found')
  }

  async getArticleTags(idArticle: number): Promise<ArticleTag[]> {
    const rows = await QueryBuilder('tags as t').join('article_tags as at', 't.id', 'at.id_tag').where('at.id_article', idArticle).select('t.id', 't.slug', 't.name')
    return rows.map(parseTag)
  }

  async setArticleTags(idArticle: number, tags: { slug: string; name: string }[]): Promise<ArticleTag[]> {
    await QueryBuilder('article_tags').where('id_article', idArticle).delete()
    if (tags.length === 0) return []
    for await (const tag of tags) {
      await QueryBuilder('tags').insert({ slug: tag.slug, name: tag.name }).onConflict('slug').merge({ name: tag.name })
    }
    const tagRows = await QueryBuilder('tags').whereIn(
      'slug',
      tags.map((t) => t.slug)
    )
    await QueryBuilder('article_tags').insert(tagRows.map((t: Record<string, unknown>) => ({ id_article: idArticle, id_tag: t.id })))
    return tagRows.map(parseTag)
  }

  async getArticleAssets(idArticle: number): Promise<ArticleAsset[]> {
    const rows = await QueryBuilder('article_assets').where('id_article', idArticle).orderBy('position', 'asc')
    return rows.map(parseAsset)
  }

  async addAsset(idArticle: number, input: AddAssetInput): Promise<ArticleAsset> {
    const [{ id }] = await QueryBuilder('article_assets')
      .insert({
        id_article: idArticle,
        type: input.type,
        url: input.url,
        caption: input.caption ?? null,
        position: input.position ?? 0,
      })
      .returning('id')
    const row = await QueryBuilder('article_assets').where('id', id).first()
    return parseAsset(row)
  }

  async removeAsset(id: number): Promise<void> {
    const count = await QueryBuilder('article_assets').where('id', id).delete()
    if (!count) throw new NotFoundError('Asset not found')
  }

  async getArticleHistory(idArticle: number): Promise<ArticleRevision[]> {
    const rows = await QueryBuilder('article_revisions').where('id_article', idArticle).orderBy('created_at', 'desc')
    return rows.map(parseRevision)
  }
}
