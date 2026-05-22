import { Router, Request, Response, NextFunction } from 'express'
import * as repo from '@contexts/article/ArticleRepository'

const searchRouter = Router()

searchRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit, sourceType, refId } = req.query

    if (sourceType && refId) {
      const articles = await repo.findBySource(String(sourceType), String(refId))
      return res.json({ results: articles, total: articles.length })
    }

    if (!q) return res.status(400).json({ error: 'Missing required query parameter: q' })

    const articles = await repo.searchArticles(String(q), Number(limit ?? 20))
    return res.json({ query: q, results: articles, total: articles.length })
  } catch (err) { next(err) }
})

export default searchRouter
