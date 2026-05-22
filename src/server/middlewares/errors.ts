import { NextFunction, Request, Response } from 'express'
import { BaseError } from '@util/errors/BaseError'

export const errors = (err: BaseError, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    console.error(err.stack)
    const { code = 'ERR500', title = 'Internal Server Error', message = `Something went wrong ${req.originalUrl}`, status = 500 } = err
    const error = { code, title, message }
    console.error(error)
    res.status(status).json({ error })
    next()
  }
}
