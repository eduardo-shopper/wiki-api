export const TOOLS = [
  {
    name: 'wiki_search',
    description: 'Keyword full-text search across wiki articles (title, summary, content, keywords). Use this first to find related content before creating anything.',
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
    name: 'wiki_search_semantic',
    description: 'Semantic vector search using AI embeddings. Finds articles by meaning rather than exact keywords — ideal for questions like "how does X work?" or "what covers topic Y?". Requires OPENAI_API_KEY to be set; returns empty results otherwise.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Natural-language question or description to search by meaning' },
        limit: { type: 'number', description: 'Max results (default 10)' },
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
