import { Router, Request, Response, NextFunction } from 'express'
import * as controller from '@contexts/article/ArticleController'

const searchRouter = Router()

searchRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  const { sourceType, refId } = req.query
  if (sourceType && refId) return controller.findBySource(req, res, next)
  return controller.search(req, res, next)
})

export default searchRouter
