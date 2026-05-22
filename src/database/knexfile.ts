import { Knex } from 'knex'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const knexConfig: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectTimeout: 60000,
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
