import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('article_revisions', (table) => {
    table.increments('id').primary()
    table.integer('id_article').unsigned().notNullable()
    table.foreign('id_article').references('id').inTable('articles').onDelete('CASCADE')
    table.string('changed_by', 255).nullable()
    table.jsonb('snapshot').notNullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.index('id_article')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('article_revisions')
}
