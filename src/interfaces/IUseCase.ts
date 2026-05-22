import { BadRequestError } from '@util/errors/RequestErrors'

export class IUseCaseBodyValidationErrors extends BadRequestError {
  constructor(errors: string[]) {
    super(`Invalid parameters: ${errors.join('; ')}`)
  }
}

export interface IUseCase<Output> {
  prepare(input: unknown): void | Promise<void>
  execute(): Promise<Output>
}

export abstract class BaseUseCase<Repository, Input, Output> implements IUseCase<Output> {
  public readonly repository: Repository

  constructor(repository: Repository) {
    this.repository = repository
  }

  abstract prepare(input: unknown): void | Promise<void>
  abstract execute(): Promise<Output>
}
