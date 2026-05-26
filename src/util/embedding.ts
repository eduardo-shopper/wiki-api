import OpenAI from 'openai'

let client: OpenAI | null = null

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return client
}

export function buildEmbeddingText(title: string, summary: string | null, keywords: string | null, content: string): string {
  return [title, summary, keywords, content]
    .filter(Boolean)
    .join('\n')
    .slice(0, 8191)
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const c = getClient()
  if (!c) return null
  try {
    const res = await c.embeddings.create({ model: 'text-embedding-3-small', input: text })
    return res.data[0].embedding
  } catch {
    return null
  }
}
