import { Router, Request, Response, NextFunction } from 'express'
import * as repo from '@contexts/article/ArticleRepository'

const articleRouter = Router()

articleRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, domain, type } = req.query
    const articles = await repo.listArticles({
      status: status as string | undefined,
      domain: domain as string | undefined,
      type: type as string | undefined,
    })
    res.json(articles)
  } catch (err) { next(err) }
})

articleRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await repo.createArticle(req.body)
    res.status(201).json(article)
  } catch (err) { next(err) }
})

articleRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id)
    const article = await repo.getArticleById(id)
    if (!article) return res.status(404).json({ error: 'Not found' })
    const sources = await repo.getArticleSources(id)
    return res.json({ ...article, sources })
  } catch (err) { next(err) }
})

articleRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await repo.updateArticle(parseInt(req.params.id), req.body)
    res.json(article)
  } catch (err) { next(err) }
})

articleRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await repo.deleteArticle(parseInt(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
})

articleRouter.get('/:id/sources', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sources = await repo.getArticleSources(parseInt(req.params.id))
    res.json(sources)
  } catch (err) { next(err) }
})

articleRouter.post('/:id/sources', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const source = await repo.addSource(parseInt(req.params.id), req.body)
    res.status(201).json(source)
  } catch (err) { next(err) }
})

articleRouter.delete('/:id/sources/:sourceId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await repo.removeSource(parseInt(req.params.sourceId))
    res.status(204).send()
  } catch (err) { next(err) }
})

export default articleRouter
