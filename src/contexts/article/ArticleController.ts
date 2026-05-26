import { Request, Response, NextFunction } from 'express'
import { SQLArticleRepository } from '@entities/article/SQLArticleRepository'
import { SuccessResponse } from '@util/response/BaseResponse'
import { SearchArticlesUseCase } from './SearchArticlesUseCase'
import { SearchSemanticUseCase } from './SearchSemanticUseCase'
import { ListArticlesUseCase } from './ListArticlesUseCase'
import { GetArticleUseCase } from './GetArticleUseCase'
import { FindBySourceUseCase } from './FindBySourceUseCase'
import { CreateArticleUseCase } from './CreateArticleUseCase'
import { UpdateArticleUseCase } from './UpdateArticleUseCase'
import { DeleteArticleUseCase } from './DeleteArticleUseCase'
import { GetSourcesUseCase } from './GetSourcesUseCase'
import { AddSourceUseCase } from './AddSourceUseCase'
import { RemoveSourceUseCase } from './RemoveSourceUseCase'
import { GetArticleHistoryUseCase } from './GetArticleHistoryUseCase'
import { GetArticleTagsUseCase } from './GetArticleTagsUseCase'
import { SetArticleTagsUseCase } from './SetArticleTagsUseCase'
import { GetArticleAssetsUseCase } from './GetArticleAssetsUseCase'
import { AddAssetUseCase } from './AddAssetUseCase'
import { RemoveAssetUseCase } from './RemoveAssetUseCase'

type AnyUseCase = { prepare(input: unknown): void | Promise<void>; execute(): Promise<unknown> }
type Ctor = new (repo: SQLArticleRepository) => AnyUseCase

function handle(Cls: Ctor, getInput: (req: Request) => unknown, status = 200) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const uc = new Cls(new SQLArticleRepository())
    try {
      await uc.prepare(getInput(req))
      const result = await uc.execute()
      if (status === 204) return res.status(204).send()
      return new SuccessResponse(res, result, status)
    } catch (err) {
      next(err)
    }
  }
}

export const search = handle(SearchArticlesUseCase, (req) => req.query)
export const searchSemantic = handle(SearchSemanticUseCase, (req) => req.query)
export const findBySource = handle(FindBySourceUseCase, (req) => req.query)
export const listArticles = handle(ListArticlesUseCase, (req) => req.query)
export const getArticle = handle(GetArticleUseCase, (req) => ({ id: req.params.id }))
export const createArticle = handle(CreateArticleUseCase, (req) => req.body, 201)
export const updateArticle = handle(UpdateArticleUseCase, (req) => ({ id: req.params.id, ...req.body }))
export const deleteArticle = handle(DeleteArticleUseCase, (req) => ({ id: req.params.id }), 204)
export const getArticleSources = handle(GetSourcesUseCase, (req) => ({ id: req.params.id }))
export const addSource = handle(AddSourceUseCase, (req) => ({ id: req.params.id, ...req.body }), 201)
export const removeSource = handle(RemoveSourceUseCase, (req) => ({ sourceId: req.params.sourceId }), 204)
export const getArticleHistory = handle(GetArticleHistoryUseCase, (req) => ({ id: req.params.id }))
export const getArticleTags = handle(GetArticleTagsUseCase, (req) => ({ id: req.params.id }))
export const setArticleTags = handle(SetArticleTagsUseCase, (req) => ({ id: req.params.id, tags: req.body }))
export const getArticleAssets = handle(GetArticleAssetsUseCase, (req) => ({ id: req.params.id }))
export const addAsset = handle(AddAssetUseCase, (req) => ({ id: req.params.id, ...req.body }), 201)
export const removeAsset = handle(RemoveAssetUseCase, (req) => ({ assetId: req.params.assetId }), 204)
