import { ArticleAsset, AddAssetInput } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'

interface Input { id: number; asset: AddAssetInput }
const VALID_TYPES = ['image', 'video', 'file']

export class AddAssetUseCase extends BaseUseCase<IArticleRepository, Input, ArticleAsset> {
  private input: Input | null = null

  prepare(raw: unknown): void {
    const { id, type, url, caption, position } = (raw ?? {}) as Record<string, unknown>
    const parsed = Number(id)
    if (!id || isNaN(parsed)) throw new BadRequestError('Missing or invalid parameter: id')
    if (!type || !VALID_TYPES.includes(type as string)) throw new BadRequestError('type must be one of: image, video, file')
    if (!url || typeof url !== 'string') throw new BadRequestError('Missing required parameter: url')
    this.input = {
      id: parsed,
      asset: {
        type: type as AddAssetInput['type'],
        url: url as string,
        caption: caption as string | undefined,
        position: position !== undefined ? Number(position) : undefined,
      },
    }
  }

  async execute(): Promise<ArticleAsset> {
    return this.repository.addAsset(this.input!.id, this.input!.asset)
  }
}
