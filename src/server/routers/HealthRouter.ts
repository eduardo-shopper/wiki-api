import { Router } from 'express'

const healthRouter = Router()

healthRouter.get('/', (_req, res) => {
  res.status(200).json({ status: 'OK', service: 'wiki_api', timestamp: new Date().toISOString() })
})

export default healthRouter
