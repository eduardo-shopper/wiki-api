import { BaseError } from './BaseError'

export class BadRequestError extends BaseError {
  constructor(message?: string, code?: string, title?: string) {
    super(message || 'Bad Request', code, title)
    this.status = 400
    this.code = code ?? 'ERR400'
  }
}

export class NotFoundError extends BaseError {
  constructor(message?: string, code?: string, title?: string) {
    super(message || 'Not Found', code, title)
    this.status = 404
    this.code = code ?? 'ERR404'
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message?: string, code?: string, title?: string) {
    super(message || 'Unauthorized', code, title)
    this.status = 401
    this.code = code ?? 'ERR401'
  }
}

export class ForbiddenError extends BaseError {
  constructor(message?: string, code?: string, title?: string) {
    super(message || 'Forbidden', code, title)
    this.status = 403
    this.code = code ?? 'ERR403'
  }
}
