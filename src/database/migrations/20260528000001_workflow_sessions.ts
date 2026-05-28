import { Knex } from 'knex'

type TB = Knex.CreateTableBuilder

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('workflow_sessions', (table: TB) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('step', 100).notNullable()
    table.enu('status', ['active', 'completed', 'failed']).notNullable().defaultTo('active')
    table.integer('total').notNullable().defaultTo(0)
    table.timestamp('expires_at').notNullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('workflow_session_items', (table: TB) => {
    table.increments('id').primary()
    table.uuid('session_id').notNullable()
    table.foreign('session_id').references('id').inTable('workflow_sessions').onDelete('CASCADE')
    table.jsonb('payload').notNullable()
    table.enu('status', ['pending', 'processing', 'done', 'failed']).notNullable().defaultTo('pending')
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })

  await knex.raw('CREATE INDEX workflow_session_items_session_status_idx ON workflow_session_items (session_id, status)')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('workflow_session_items')
  await knex.schema.dropTableIfExists('workflow_sessions')
}
