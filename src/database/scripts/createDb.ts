import knex from 'knex'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

function resolveSslConfig() {
  const sslFlag = process.env.DB_SSL
  const host = process.env.DB_HOST || ''
  const shouldUseSsl = sslFlag === 'true' || (sslFlag !== 'false' && host.includes('neon.tech'))
  if (!shouldUseSsl) return false
  return { rejectUnauthorized: false }
}

async function createDb() {
  const db = process.env.DB_NAME || 'shopper_wiki'

  const conn = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: 'postgres',
      ssl: resolveSslConfig(),
    },
  })

  try {
    await conn.raw(`CREATE DATABASE "${db}"`)
    console.info(`Database "${db}" created`)
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '42P04') {
      console.info(`Database "${db}" already exists`)
    } else {
      throw err
    }
  } finally {
    await conn.destroy()
  }
}

createDb().catch((err) => {
  console.error(err)
  process.exit(1)
})
