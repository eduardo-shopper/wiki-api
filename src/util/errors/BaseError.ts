export class BaseError extends Error {
  name: string
  status = 500
  code: string
  title?: string

  constructor(message?: string, code?: string, title?: string) {
    super(message || 'Internal Server Error')
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.title = title
    this.code = code ?? 'ERR500'
  }
}
