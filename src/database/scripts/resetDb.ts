import knex from 'knex'
import dotenv from 'dotenv'

dotenv.config()

async function resetDb() {
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

  await conn.raw(`DROP DATABASE IF EXISTS "${db}" WITH (FORCE)`)
  await conn.raw(`CREATE DATABASE "${db}"`)
  console.info(`Database "${db}" reset successfully`)
  await conn.destroy()
}

resetDb().catch((err) => {
  console.error(err)
  process.exit(1)
})
