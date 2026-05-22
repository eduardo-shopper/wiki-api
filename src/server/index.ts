import 'dotenv/config'
import express, { Express, Router, json, urlencoded } from 'express'
import cors from 'cors'
import logger from 'morgan'
import { errors } from './middlewares/errors'
import healthRouter from './routers/HealthRouter'
import mcpRouter from './routers/McpRouter'
import articleRouter from './routers/ArticleRouter'
import searchRouter from './routers/SearchRouter'

const app: Express = express()

app.use(cors())
app.use(logger('dev'))
app.use(json())
app.use(urlencoded({ extended: true }))

app.use((_req, res, next) => {
  res.header('api-version', process.env.npm_package_version)
  next()
})

app.use('/health', healthRouter)
app.use('/mcp', mcpRouter)
app.use('/articles', articleRouter)
app.use('/search', searchRouter)

const notFoundRouter = Router()
notFoundRouter.all('*', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})
app.use(notFoundRouter)

app.use(errors)

const port = parseInt(process.env.PORT || '3100')

app.listen(port, () => {
  console.info(`🚀 wiki_api running on port ${port}`)
})
