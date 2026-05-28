import { Knex } from 'knex'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

function resolveSslConfig() {
  const sslFlag = process.env.DB_SSL
  const host = process.env.DB_HOST || ''
  const shouldUseSsl = sslFlag === 'true' || (sslFlag !== 'false' && host.includes('neon.tech'))
  if (!shouldUseSsl) return false
  return { rejectUnauthorized: false }
}

const knexConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: resolveSslConfig(),
  },
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
    extension: 'ts',
  },
  pool: {
    min: 2,
    max: 10,
  },
}

export default knexConfig
