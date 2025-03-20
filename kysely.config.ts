import { defineConfig } from "kysely-ctl";
import { db } from "./db";

export default defineConfig({
	kysely: db,
});
