import { Router } from 'express'
import * as controller from '@contexts/article/ArticleController'

const articleRouter = Router()

articleRouter.get('/', controller.listArticles)
articleRouter.post('/', controller.createArticle)
articleRouter.get('/:id', controller.getArticle)
articleRouter.patch('/:id', controller.updateArticle)
articleRouter.delete('/:id', controller.deleteArticle)
articleRouter.get('/:id/sources', controller.getArticleSources)
articleRouter.post('/:id/sources', controller.addSource)
articleRouter.delete('/:id/sources/:sourceId', controller.removeSource)
articleRouter.get('/:id/history', controller.getArticleHistory)
articleRouter.get('/:id/tags', controller.getArticleTags)
articleRouter.put('/:id/tags', controller.setArticleTags)
articleRouter.get('/:id/assets', controller.getArticleAssets)
articleRouter.post('/:id/assets', controller.addAsset)
articleRouter.delete('/:id/assets/:assetId', controller.removeAsset)

export default articleRouter
