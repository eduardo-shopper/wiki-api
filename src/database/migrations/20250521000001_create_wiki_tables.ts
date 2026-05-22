import { Knex } from 'knex'

type TB = Knex.CreateTableBuilder

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('categories', (table: TB) => {
    table.increments('id').primary()
    table.string('slug', 255).notNullable().unique()
    table.string('name', 255).notNullable()
    table.integer('id_parent').unsigned().nullable()
    table.foreign('id_parent').references('id').inTable('categories').onDelete('SET NULL')
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('articles', (table: TB) => {
    table.increments('id').primary()
    table.string('slug', 255).notNullable().unique()
    table.string('title', 512).notNullable()
    table.text('summary').nullable()
    table.specificType('content', 'LONGTEXT').notNullable()

    // Agent-writable keywords: pre-processed terms not always in the body
    // (synonyms, business aliases). Included in the FULLTEXT index.
    table.string('keywords', 1024).nullable()

    // Structured metadata for agents deciding where to route new information:
    // { type: 'technical'|'business'|'process'|'glossary',
    //   domain: string,           e.g. 'crm', 'chat', 'logistics'
    //   auto_managed: boolean,    agent may update without human approval
    //   last_synced_at: string|null }
    table.json('context').nullable()

    table.enu('status', ['draft', 'published', 'archived']).notNullable().defaultTo('draft')
    table.integer('id_category').unsigned().nullable()
    table.foreign('id_category').references('id').inTable('categories').onDelete('SET NULL')
    table.string('created_by', 255).nullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
  })

  // FULLTEXT spans title + summary + content + keywords so a single
  // MATCH ... AGAINST query covers both human-written and agent-written terms.
  await knex.raw('ALTER TABLE `articles` ADD FULLTEXT INDEX `ft_articles_search` (`title`, `summary`, `content`, `keywords`)')

  await knex.schema.createTable('tags', (table: TB) => {
    table.increments('id').primary()
    table.string('slug', 255).notNullable().unique()
    table.string('name', 255).notNullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('article_tags', (table: TB) => {
    table.integer('id_article').unsigned().notNullable()
    table.integer('id_tag').unsigned().notNullable()
    table.primary(['id_article', 'id_tag'])
    table.foreign('id_article').references('id').inTable('articles').onDelete('CASCADE')
    table.foreign('id_tag').references('id').inTable('tags').onDelete('CASCADE')
  })

  // Normalized external references — lets agents query
  // "which articles are already linked to ClickUp task CRM-123?" in one indexed join.
  await knex.schema.createTable('article_sources', (table: TB) => {
    table.increments('id').primary()
    table.integer('id_article').unsigned().notNullable()
    table.foreign('id_article').references('id').inTable('articles').onDelete('CASCADE')
    table.enu('type', ['clickup_task', 'github_pr', 'github_commit', 'code_file', 'manual']).notNullable()
    table.string('ref_id', 512).notNullable()
    table.json('meta').nullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.unique(['id_article', 'type', 'ref_id'])
  })

  // Placeholder for images/videos — exists from day one so no future schema migration needed.
  await knex.schema.createTable('article_assets', (table: TB) => {
    table.increments('id').primary()
    table.integer('id_article').unsigned().notNullable()
    table.foreign('id_article').references('id').inTable('articles').onDelete('CASCADE')
    table.enu('type', ['image', 'video', 'file']).notNullable()
    table.string('url', 2048).notNullable()
    table.string('caption', 512).nullable()
    table.integer('position').unsigned().notNullable().defaultTo(0)
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('article_assets')
  await knex.schema.dropTableIfExists('article_sources')
  await knex.schema.dropTableIfExists('article_tags')
  await knex.schema.dropTableIfExists('tags')
  await knex.schema.dropTableIfExists('articles')
  await knex.schema.dropTableIfExists('categories')
}
