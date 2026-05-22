import { Router, Request, Response } from 'express'
import * as repo from '@contexts/article/ArticleRepository'
import { ArticleContext, ArticleStatus, SourceType } from '@entities/Article'
import { BaseError } from '@util/errors/BaseError'

const mcpRouter = Router()

const SERVER_INFO = { name: 'wiki', version: '1.0.0' }
const PROTOCOL_VERSION = '2024-11-05'

// ─── Tool definitions ───────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'wiki_search',
    description: 'Full-text search across wiki articles (title, summary, content, keywords). Use this first to find related content before creating anything.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search keywords or phrase' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
      required: ['q'],
    },
  },
  {
    name: 'wiki_list_articles',
    description: 'List articles with optional filters. Good for browsing by domain or status.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['draft', 'published', 'archived'], description: 'Filter by status' },
        domain: { type: 'string', description: 'Filter by context.domain (e.g. "crm", "chat")' },
        type: { type: 'string', enum: ['technical', 'business', 'process', 'glossary'], description: 'Filter by context.type' },
      },
    },
  },
  {
    name: 'wiki_get_article',
    description: 'Get the full content of an article including sources. Use after wiki_search to read the full text before deciding to update.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Article ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wiki_find_by_source',
    description: 'Check if an article is already linked to an external source (ClickUp task, PR, commit, file). Call this before creating to avoid duplicates.',
    inputSchema: {
      type: 'object',
      properties: {
        sourceType: { type: 'string', enum: ['clickup_task', 'github_pr', 'github_commit', 'code_file', 'manual'] },
        refId: { type: 'string', description: 'External ID — ClickUp task ID, PR number, commit SHA, file path, etc.' },
      },
      required: ['sourceType', 'refId'],
    },
  },
  {
    name: 'wiki_create_article',
    description: 'Create a new wiki article. Content should be markdown. Set status to "draft" for agent-generated content pending review.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string', description: 'Markdown body' },
        summary: { type: 'string', description: 'One-sentence description shown in search results' },
        keywords: { type: 'string', description: 'Space-separated terms the agent identified as important (synonyms, aliases)' },
        context: {
          type: 'object',
          description: 'Structured metadata',
          properties: {
            type: { type: 'string', enum: ['technical', 'business', 'process', 'glossary'] },
            domain: { type: 'string' },
            autoManaged: { type: 'boolean' },
          },
          required: ['type', 'domain'],
        },
        status: { type: 'string', enum: ['draft', 'published', 'archived'] },
        createdBy: { type: 'string', description: 'Agent or user identifier' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'wiki_update_article',
    description: 'Partially update an article. Only supplied fields are changed — omit fields you do not want to overwrite.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        title: { type: 'string' },
        content: { type: 'string' },
        summary: { type: 'string' },
        keywords: { type: 'string' },
        context: { type: 'object' },
        status: { type: 'string', enum: ['draft', 'published', 'archived'] },
      },
      required: ['id'],
    },
  },
  {
    name: 'wiki_delete_article',
    description: 'Permanently delete an article and all its sources. Use with caution — prefer archiving (wiki_update_article status=archived) when in doubt.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wiki_add_source',
    description: 'Link an article to an external source. Call this after creating or updating an article to record what triggered the change.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Article ID' },
        sourceType: { type: 'string', enum: ['clickup_task', 'github_pr', 'github_commit', 'code_file', 'manual'] },
        refId: { type: 'string', description: 'External identifier' },
        meta: { type: 'object', description: 'Optional snapshot of the source (title, description, URL, etc.)' },
      },
      required: ['id', 'sourceType', 'refId'],
    },
  },
  {
    name: 'wiki_remove_source',
    description: 'Remove a source link from an article.',
    inputSchema: {
      type: 'object',
      properties: {
        sourceId: { type: 'number', description: 'ID of the article_sources row' },
      },
      required: ['sourceId'],
    },
  },
]

// ─── Tool handlers ───────────────────────────────────────────────────────────

type Args = Record<string, unknown>
type ToolFn = (args: Args) => Promise<unknown>

const TOOL_HANDLERS: Record<string, ToolFn> = {
  wiki_search: (args) => repo.searchArticles(String(args.q ?? ''), Number(args.limit ?? 20)),

  wiki_list_articles: (args) =>
    repo.listArticles({
      status: args.status as string | undefined,
      domain: args.domain as string | undefined,
      type: args.type as string | undefined,
    }),

  wiki_get_article: async (args) => {
    const article = await repo.getArticleById(Number(args.id))
    if (!article) return null
    const sources = await repo.getArticleSources(Number(args.id))
    return { ...article, sources }
  },

  wiki_find_by_source: (args) => repo.findBySource(String(args.sourceType), String(args.refId)),

  wiki_create_article: (args) =>
    repo.createArticle({
      title: String(args.title),
      content: String(args.content),
      summary: args.summary as string | undefined,
      keywords: args.keywords as string | undefined,
      context: args.context as ArticleContext | undefined,
      status: args.status as ArticleStatus | undefined,
      createdBy: args.createdBy as string | undefined,
    }),

  wiki_update_article: (args) =>
    repo.updateArticle(Number(args.id), {
      title: args.title as string | undefined,
      content: args.content as string | undefined,
      summary: args.summary as string | null | undefined,
      keywords: args.keywords as string | null | undefined,
      context: args.context as ArticleContext | null | undefined,
      status: args.status as ArticleStatus | undefined,
    }),

  wiki_delete_article: async (args) => {
    await repo.deleteArticle(Number(args.id))
    return { deleted: true, id: Number(args.id) }
  },

  wiki_add_source: (args) =>
    repo.addSource(Number(args.id), {
      type: args.sourceType as SourceType,
      refId: String(args.refId),
      meta: args.meta as Record<string, unknown> | undefined,
    }),

  wiki_remove_source: async (args) => {
    await repo.removeSource(Number(args.sourceId))
    return { removed: true, sourceId: Number(args.sourceId) }
  },
}

function callTool(name: string, args: Args): Promise<unknown> {
  const handler = TOOL_HANDLERS[name]
  if (!handler) throw new BaseError(`Unknown tool: ${name}`, 'ERR400', 'Bad request', 400)
  return handler(args)
}

// ─── MCP method handlers ─────────────────────────────────────────────────────

function handleInitialize(id: unknown, _params: unknown, res: Response) {
  return res.json({
    jsonrpc: '2.0',
    id,
    result: {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: SERVER_INFO,
    },
  })
}

function handleToolsList(id: unknown, _params: unknown, res: Response) {
  return res.json({ jsonrpc: '2.0', id, result: { tools: TOOLS } })
}

async function handleToolCall(id: unknown, params: unknown, res: Response) {
  const { name = '', arguments: args = {} } = (params ?? {}) as { name?: string; arguments?: Args }
  try {
    const data = await callTool(name, args)
    return res.json({
      jsonrpc: '2.0',
      id,
      result: { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return res.json({ jsonrpc: '2.0', id, error: { code: -32603, message } })
  }
}

type McpHandler = (id: unknown, params: unknown, res: Response) => Response | void | Promise<Response | void>

const METHOD_HANDLERS: Record<string, McpHandler> = {
  initialize: handleInitialize,
  'tools/list': handleToolsList,
  'tools/call': handleToolCall,
}

// ─── REST routes (direct HTTP use, same logic) ───────────────────────────────

mcpRouter.get('/search', async (req: Request, res: Response, next) => {
  try {
    const { q, limit } = req.query
    if (!q) return res.status(400).json({ error: 'Missing q' })
    const results = await repo.searchArticles(String(q), Number(limit ?? 20))
    return res.json({ query: q, results, total: results.length })
  } catch (err) {
    next(err)
  }
})

mcpRouter.get('/articles/:id', async (req: Request, res: Response, next) => {
  try {
    const article = await repo.getArticleById(parseInt(req.params.id))
    if (!article) return res.status(404).json({ error: 'Not found' })
    const sources = await repo.getArticleSources(article.id)
    return res.json({ ...article, sources })
  } catch (err) {
    next(err)
  }
})

// ─── MCP JSON-RPC endpoint ───────────────────────────────────────────────────

mcpRouter.post('/', (req: Request, res: Response) => {
  const body = req.body ?? {}
  const { id, method, params } = body

  const handler = METHOD_HANDLERS[method]
  if (handler) return handler(id, params, res)

  // JSON-RPC notifications have no `id` — acknowledge without a response body
  if (!('id' in body)) return res.status(202).end()

  return res.status(400).json({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  })
})

export default mcpRouter
