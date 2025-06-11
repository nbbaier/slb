import { defineConfig } from "drizzle-kit";

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
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
  },
});
