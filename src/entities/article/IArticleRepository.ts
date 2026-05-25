import {
  Article,
  ArticleSource,
  ArticleTag,
  ArticleAsset,
  ArticleRevision,
  CreateArticleInput,
  UpdateArticleInput,
  AddSourceInput,
  AddAssetInput,
  ListFilters,
} from '@entities/Article'

export interface IArticleRepository {
  searchArticles(q: string, limit: number): Promise<Article[]>
  listArticles(filters: ListFilters): Promise<Article[]>
  getArticleById(id: number): Promise<Article | null>
  findBySource(type: string, refId: string): Promise<Article[]>
  createArticle(input: CreateArticleInput): Promise<Article>
  updateArticle(id: number, input: UpdateArticleInput): Promise<Article>
  deleteArticle(id: number): Promise<void>
  getArticleSources(idArticle: number): Promise<ArticleSource[]>
  addSource(idArticle: number, input: AddSourceInput): Promise<ArticleSource>
  removeSource(id: number): Promise<void>
  getArticleTags(idArticle: number): Promise<ArticleTag[]>
  setArticleTags(idArticle: number, tags: { slug: string; name: string }[]): Promise<ArticleTag[]>
  getArticleAssets(idArticle: number): Promise<ArticleAsset[]>
  addAsset(idArticle: number, input: AddAssetInput): Promise<ArticleAsset>
  removeAsset(id: number): Promise<void>
  getArticleHistory(idArticle: number): Promise<ArticleRevision[]>
}
