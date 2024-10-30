import { defineConfig } from "drizzle-kit";
import { DB_PATH } from "./config";

export default defineConfig({
	dialect: "turso",
	schema: "./src/db/schema/*.ts",
	out: "./migrations",
	casing: "snake_case",
	migrations: {
		prefix: "timestamp",
		table: "__drizzle_migrations__",
	},
	dbCredentials: {
		url: `file:${DB_PATH}`,
	},
});
