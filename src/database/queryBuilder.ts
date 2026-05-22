import knex from 'knex'
import knexConfig from './knexfile'

const QueryBuilder = knex(knexConfig)

export default QueryBuilder
