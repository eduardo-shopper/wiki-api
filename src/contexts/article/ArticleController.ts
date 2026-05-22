import { Request, Response, NextFunction } from 'express'
import { SQLArticleRepository } from '@entities/article/SQLArticleRepository'
import { SuccessResponse } from '@util/response/BaseResponse'
import { SearchArticlesUseCase } from './SearchArticlesUseCase'
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

export const search = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new SearchArticlesUseCase(new SQLArticleRepository())
  try {
    useCase.prepare(req.query)
    const result = await useCase.execute()
    return new SuccessResponse(res, result)
  } catch (err) { next(err) }
}

export const findBySource = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new FindBySourceUseCase(new SQLArticleRepository())
  try {
    useCase.prepare(req.query)
    const result = await useCase.execute()
    return new SuccessResponse(res, result)
  } catch (err) { next(err) }
}

export const listArticles = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new ListArticlesUseCase(new SQLArticleRepository())
  try {
    useCase.prepare(req.query)
    const result = await useCase.execute()
    return new SuccessResponse(res, result)
  } catch (err) { next(err) }
}

export const getArticle = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new GetArticleUseCase(new SQLArticleRepository())
  try {
    useCase.prepare({ id: req.params.id })
    const result = await useCase.execute()
    return new SuccessResponse(res, result)
  } catch (err) { next(err) }
}

export const createArticle = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new CreateArticleUseCase(new SQLArticleRepository())
  try {
    useCase.prepare(req.body)
    const result = await useCase.execute()
    return new SuccessResponse(res, result, 201)
  } catch (err) { next(err) }
}

export const updateArticle = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new UpdateArticleUseCase(new SQLArticleRepository())
  try {
    useCase.prepare({ id: req.params.id, ...req.body })
    const result = await useCase.execute()
    return new SuccessResponse(res, result)
  } catch (err) { next(err) }
}

export const deleteArticle = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new DeleteArticleUseCase(new SQLArticleRepository())
  try {
    useCase.prepare({ id: req.params.id })
    await useCase.execute()
    res.status(204).send()
  } catch (err) { next(err) }
}

export const getArticleSources = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new GetSourcesUseCase(new SQLArticleRepository())
  try {
    useCase.prepare({ id: req.params.id })
    const result = await useCase.execute()
    return new SuccessResponse(res, result)
  } catch (err) { next(err) }
}

export const addSource = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new AddSourceUseCase(new SQLArticleRepository())
  try {
    useCase.prepare({ id: req.params.id, ...req.body })
    const result = await useCase.execute()
    return new SuccessResponse(res, result, 201)
  } catch (err) { next(err) }
}

export const removeSource = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new RemoveSourceUseCase(new SQLArticleRepository())
  try {
    useCase.prepare({ sourceId: req.params.sourceId })
    await useCase.execute()
    res.status(204).send()
  } catch (err) { next(err) }
}

export const getArticleHistory = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new GetArticleHistoryUseCase(new SQLArticleRepository())
  try {
    useCase.prepare({ id: req.params.id })
    const result = await useCase.execute()
    return new SuccessResponse(res, result)
  } catch (err) { next(err) }
}

export const getArticleTags = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new GetArticleTagsUseCase(new SQLArticleRepository())
  try {
    useCase.prepare({ id: req.params.id })
    const result = await useCase.execute()
    return new SuccessResponse(res, result)
  } catch (err) { next(err) }
}

export const setArticleTags = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new SetArticleTagsUseCase(new SQLArticleRepository())
  try {
    useCase.prepare({ id: req.params.id, tags: req.body })
    const result = await useCase.execute()
    return new SuccessResponse(res, result)
  } catch (err) { next(err) }
}

export const getArticleAssets = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new GetArticleAssetsUseCase(new SQLArticleRepository())
  try {
    useCase.prepare({ id: req.params.id })
    const result = await useCase.execute()
    return new SuccessResponse(res, result)
  } catch (err) { next(err) }
}

export const addAsset = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new AddAssetUseCase(new SQLArticleRepository())
  try {
    useCase.prepare({ id: req.params.id, ...req.body })
    const result = await useCase.execute()
    return new SuccessResponse(res, result, 201)
  } catch (err) { next(err) }
}

export const removeAsset = async (req: Request, res: Response, next: NextFunction) => {
  const useCase = new RemoveAssetUseCase(new SQLArticleRepository())
  try {
    useCase.prepare({ assetId: req.params.assetId })
    await useCase.execute()
    res.status(204).send()
  } catch (err) { next(err) }
}
