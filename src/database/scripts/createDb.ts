import knex from 'knex'
import dotenv from 'dotenv'

dotenv.config()

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
