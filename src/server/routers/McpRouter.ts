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
import { TOOLS } from './McpTools'

const mcpRouter = Router()

const SERVER_INFO = { name: 'wiki', version: '1.0.0' }
const PROTOCOL_VERSION = '2024-11-05'

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
