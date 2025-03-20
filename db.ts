import type { DB } from "./generated/db.d.ts";
import { Kysely, PostgresDialect } from "kysely";
import pkg from "pg";

const { Pool } = pkg;

const dialect = new PostgresDialect({
	pool: new Pool({
		database: process.env.DB_NAME,
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		port: Number(process.env.DB_PORT),
		ssl: process.env.DB_SSL === "true",
		max: 10,
	}),
});

export const db = new Kysely<DB>({
	dialect,
});
