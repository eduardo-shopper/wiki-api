export class BaseError extends Error {
  code: string
  title: string
  status: number

  constructor(message: string, code = 'ERR500', title = 'Internal Server Error', status = 500) {
    super(message)
    this.code = code
    this.title = title
    this.status = status
  }
}
