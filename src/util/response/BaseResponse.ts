import { Response } from 'express'

export class SuccessResponse<T> {
  constructor(res: Response, data: T, status = 200) {
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = status
    res.json(data)
  }
}
