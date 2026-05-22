import { Router } from 'express'

const healthRouter = Router()

healthRouter.get('/', (_req, res) => {
  res.status(200).json({ status: 'OK', service: 'wiki_api' })
})

export default healthRouter
