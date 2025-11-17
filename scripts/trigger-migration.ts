// This is the file which you can run as a script to generate a migration for your triggers

import { exec } from "node:child_process";
import { glob, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import type { Query, SQL } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { SQLiteSyncDialect } from "drizzle-orm/sqlite-core";
import config from "../drizzle.config";
import {
  breakpoint,
  createDropTriggerStatement,
  Trigger,
} from "../src/db/trigger";

const sqlite = new SQLiteSyncDialect();
const migrationsDirectory = config.out as string;
const triggerNameRegExp = /CREATE TRIGGER\s*['"`]?(\w+)['"`]?/g;

async function execAsync(command: string): Promise<string> {
  const { stderr, stdout } = await promisify(exec)(command);
  if (stderr) {
    console.error(stderr);
  }
  return stdout;
}

export default async function main() {
  const triggers = await getTriggers();
  const previousTriggers = await getPreviousTriggers();
  const dropPreviousTriggers = previousTriggers.map(createDropTriggerStatement);
  const migrationSql = createMigration(
    ...dropPreviousTriggers,
    ...triggers.map((trigger) => trigger.statement),
  );
  const migration = serializeQuery(migrationSql);
  const migrationFilePath = await generateCustomMigrationFile();
  return await writeFile(migrationFilePath, migration);
}

async function getTriggers(): Promise<Trigger[]> {
  const files: string[] = [];
  for await (const file of glob(config.schema as string)) {
    files.push(file);
  }
  const modules = await Promise.all(files.map((file) => import(resolve(file))));
  return modules
    .flatMap((module) => module && Object.values(module))
    .filter((value): value is Trigger => value instanceof Trigger);
}

async function getPreviousTriggers() {
  const files = await readdir(migrationsDirectory);
  const sqlFiles = files
    .filter((file) => file.endsWith(".sql"))
    .map((file) => resolve(migrationsDirectory, file));
  const migrations = await Promise.all(
    sqlFiles.map((file) => readFile(file, "utf-8")),
  );
  return migrations.flatMap((migration) =>
    [...migration.matchAll(triggerNameRegExp)]
      .map((match) => match[1])
      .filter((match): match is NonNullable<typeof match> => !!match),
  );
}

async function generateCustomMigrationFile() {
  const stdout = (await execAsync(
    "bunx --bun drizzle-kit generate --custom",
  )) as string;
  const file = stdout.match(
    /Your SQL migration file.+migrations\/(.+\.sql)/,
  )?.[1];
  if (!file) throw Error("Could not resolve migration file path");
  return resolve(migrationsDirectory, file);
}

function createMigration(...statements: Array<SQL>) {
  return sqlite.sqlToQuery(sql.join(statements, breakpoint));
}

function serializeQuery(query: Query) {
  return `${query.sql
    .split("?")
    .map((chunk, i) => {
      if (!chunk) return "";

      if (!(i in query.params)) return chunk;
      const param = query.params[i];

      const stringified = typeof param === "string" ? `"${param}"` : param;
      return `${chunk}${String(stringified)}`;
    })
    .join("")}`;
}

main();
