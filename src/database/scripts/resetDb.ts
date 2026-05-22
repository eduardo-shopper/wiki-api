import knex from 'knex'
import dotenv from 'dotenv'

dotenv.config()

async function resetDb() {
  const db = process.env.DB_NAME || 'shopper_wiki'

  const conn = knex({
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    },
  })

  await conn.raw(`DROP DATABASE IF EXISTS \`${db}\``)
  await conn.raw(`CREATE DATABASE \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  console.info(`Database \`${db}\` reset successfully`)
  await conn.destroy()
}

resetDb().catch((err) => {
  console.error(err)
  process.exit(1)
})
