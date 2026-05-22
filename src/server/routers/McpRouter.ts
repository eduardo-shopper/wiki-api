import { Router, Request, Response } from 'express'
import { SQLArticleRepository } from '@entities/article/SQLArticleRepository'
import { ArticleContext, ArticleStatus, SourceType } from '@entities/Article'
import { BadRequestError } from '@util/errors/RequestErrors'
import { SearchArticlesUseCase } from '@contexts/article/SearchArticlesUseCase'
import { ListArticlesUseCase } from '@contexts/article/ListArticlesUseCase'
import { GetArticleUseCase } from '@contexts/article/GetArticleUseCase'
import { FindBySourceUseCase } from '@contexts/article/FindBySourceUseCase'
import { CreateArticleUseCase } from '@contexts/article/CreateArticleUseCase'
import { UpdateArticleUseCase } from '@contexts/article/UpdateArticleUseCase'
import { DeleteArticleUseCase } from '@contexts/article/DeleteArticleUseCase'
import { AddSourceUseCase } from '@contexts/article/AddSourceUseCase'
import { RemoveSourceUseCase } from '@contexts/article/RemoveSourceUseCase'
import { GetArticleHistoryUseCase } from '@contexts/article/GetArticleHistoryUseCase'
import { SetArticleTagsUseCase } from '@contexts/article/SetArticleTagsUseCase'
import { AddAssetUseCase } from '@contexts/article/AddAssetUseCase'
import { RemoveAssetUseCase } from '@contexts/article/RemoveAssetUseCase'
import * as controller from '@contexts/article/ArticleController'

const mcpRouter = Router()

const SERVER_INFO = { name: 'wiki', version: '1.0.0' }
const PROTOCOL_VERSION = '2024-11-05'

// ─── Tool definitions ────────────────────────────────────────────────────────

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
  {
    name: 'wiki_get_history',
    description:
      'Get the change history of an article. Returns revisions in reverse-chronological order, each with a full snapshot of the article at that point and who made the change.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Article ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'wiki_set_tags',
    description: 'Replace the full tag list on an article (PUT semantics). Pass an empty array to clear all tags.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Article ID' },
        tags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slug: { type: 'string', description: 'URL-safe identifier, e.g. "crm-integration"' },
              name: { type: 'string', description: 'Human-readable label, e.g. "CRM Integration"' },
            },
            required: ['slug', 'name'],
          },
        },
      },
      required: ['id', 'tags'],
    },
  },
  {
    name: 'wiki_add_asset',
    description: 'Attach an image, video, or file URL to an article.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Article ID' },
        type: { type: 'string', enum: ['image', 'video', 'file'] },
        url: { type: 'string', description: 'Public URL of the asset' },
        caption: { type: 'string', description: 'Optional caption' },
        position: { type: 'number', description: 'Sort order (default 0)' },
      },
      required: ['id', 'type', 'url'],
    },
  },
  {
    name: 'wiki_remove_asset',
    description: 'Remove an asset from an article.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: { type: 'number', description: 'ID of the article_assets row' },
      },
      required: ['assetId'],
    },
  },
]

// ─── Tool handlers ────────────────────────────────────────────────────────────

type Args = Record<string, unknown>

type AnyUseCase = {
  prepare(input: unknown): void | Promise<void>
  execute(): Promise<unknown>
}
type UseCaseCtor = new (repo: SQLArticleRepository) => AnyUseCase

async function runUseCase(Cls: UseCaseCtor, args: Args): Promise<unknown> {
  const uc = new Cls(new SQLArticleRepository())
  await uc.prepare(args)
  return uc.execute()
}

const TOOL_HANDLERS: Record<string, (args: Args) => Promise<unknown>> = {
  wiki_search: (args) => runUseCase(SearchArticlesUseCase, args),

  wiki_list_articles: (args) => runUseCase(ListArticlesUseCase, args),

  wiki_get_article: (args) => runUseCase(GetArticleUseCase, args),

  wiki_find_by_source: (args) => runUseCase(FindBySourceUseCase, { sourceType: args.sourceType, refId: args.refId }),

  wiki_create_article: (args) =>
    runUseCase(CreateArticleUseCase, {
      title: String(args.title),
      content: String(args.content),
      summary: args.summary as string | undefined,
      keywords: args.keywords as string | undefined,
      context: args.context as ArticleContext | undefined,
      status: args.status as ArticleStatus | undefined,
      createdBy: args.createdBy as string | undefined,
    }),

  wiki_update_article: (args) =>
    runUseCase(UpdateArticleUseCase, {
      id: Number(args.id),
      title: args.title as string | undefined,
      content: args.content as string | undefined,
      summary: args.summary as string | null | undefined,
      keywords: args.keywords as string | null | undefined,
      context: args.context as ArticleContext | null | undefined,
      status: args.status as ArticleStatus | undefined,
    }),

  wiki_delete_article: async (args) => {
    await runUseCase(DeleteArticleUseCase, { id: Number(args.id) })
    return { deleted: true, id: Number(args.id) }
  },

  wiki_add_source: (args) =>
    runUseCase(AddSourceUseCase, {
      id: Number(args.id),
      type: args.sourceType as SourceType,
      refId: String(args.refId),
      meta: args.meta as Record<string, unknown> | undefined,
    }),

  wiki_remove_source: async (args) => {
    await runUseCase(RemoveSourceUseCase, { sourceId: Number(args.sourceId) })
    return { removed: true, sourceId: Number(args.sourceId) }
  },

  wiki_get_history: (args) => runUseCase(GetArticleHistoryUseCase, { id: Number(args.id) }),

  wiki_set_tags: (args) => runUseCase(SetArticleTagsUseCase, { id: Number(args.id), tags: args.tags }),

  wiki_add_asset: (args) =>
    runUseCase(AddAssetUseCase, {
      id: Number(args.id),
      type: args.type,
      url: args.url,
      caption: args.caption,
      position: args.position !== undefined ? Number(args.position) : undefined,
    }),

  wiki_remove_asset: async (args) => {
    await runUseCase(RemoveAssetUseCase, { assetId: Number(args.assetId) })
    return { removed: true, assetId: Number(args.assetId) }
  },
}

function callTool(name: string, args: Args): Promise<unknown> {
  const handler = TOOL_HANDLERS[name]
  if (!handler) throw new BadRequestError(`Unknown tool: ${name}`)
  return handler(args)
}

// ─── MCP method handlers ──────────────────────────────────────────────────────

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

// ─── REST routes (direct HTTP use) ───────────────────────────────────────────

mcpRouter.get('/search', controller.search)
mcpRouter.get('/articles/:id', controller.getArticle)

// ─── MCP JSON-RPC endpoint ────────────────────────────────────────────────────

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
