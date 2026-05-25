import { ArticleAsset, AddAssetInput } from '@entities/Article'
import { IArticleRepository } from '@entities/article/IArticleRepository'
import { BaseUseCase } from '@interfaces/IUseCase'
import { BadRequestError } from '@util/errors/RequestErrors'
import { parseNumericId, requireString } from '@util/validate'

interface Input {
  id: number
  asset: AddAssetInput
}

const VALID_TYPES = ['image', 'video', 'file']

function parseAssetType(type: unknown): AddAssetInput['type'] {
  if (!type || !VALID_TYPES.includes(type as string)) throw new BadRequestError('type must be one of: image, video, file')
  return type as AddAssetInput['type']
}

export class AddAssetUseCase extends BaseUseCase<IArticleRepository, ArticleAsset> {
  private input: Input | null = null

  prepare(raw: unknown): void {
    const { id, type, url, caption, position } = (raw ?? {}) as Record<string, unknown>
    this.input = {
      id: parseNumericId(id),
      asset: {
        type: parseAssetType(type),
        url: requireString(url, 'url'),
        caption: caption as string | undefined,
        position: position !== undefined ? Number(position) : undefined,
      },
    }
  }

  execute(): Promise<ArticleAsset> {
    return this.repository.addAsset(this.input!.id, this.input!.asset)
  }
}
