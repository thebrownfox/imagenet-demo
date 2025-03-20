import { type Kysely, sql } from 'kysely'

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	// up migration code goes here...
	// note: up migrations are mandatory. you must implement this function.
	// For more info, see: https://kysely.dev/docs/migrations

	await db.schema
		.createTable('record')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('size', 'integer', (col) => col.notNull())
		.addColumn("created_at", "timestamptz", (col) =>
			col.defaultTo(sql`now()`).notNull(),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.defaultTo(sql`now()`).notNull(),
		)
		.execute()

}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	// down migration code goes here...
	// note: down migrations are optional. you can safely delete this function.
	// For more info, see: https://kysely.dev/docs/migrations
	await db.schema.dropTable("record").ifExists().execute();

}
