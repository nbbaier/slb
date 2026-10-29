# Coding standards

## Style
- Bun runtime and APIs; TypeScript only. Biome formats and lints.
- `import type` for type-only imports; `node:` prefix for Node built-ins.
- `async/await`; wrap side effects in `try/catch` and log, as the import loops
  in `src/db/procedures/` do.

## Tables
- Every table spreads `rowTimestampColumns(t)` from `src/db/schema/sharedCols.ts`.
- Name columns in camelCase in TypeScript. Drizzle maps them to snake_case
  (`casing: "snake_case"` in both `drizzle.config.ts` and `src/db/index.ts`).
- Add relations to `src/db/schema/relations.ts`.

## Triggers
Drizzle has no trigger support, so triggers are `Trigger` instances from
`src/db/trigger.ts`, exported from a schema file; `scripts/trigger-migration.ts`
finds them by export. Model new ones on `updateAuthorsTimestampTrigger`. Raw SQL
inside `do` must use the real snake_case column names.

## Inserts
- Write through the per-table helpers in `src/db/queries/insert.ts`
  (`insertAuthor`, `insertPaper`, ...); add one per new table, wrapping
  `insertIntoTable`.
- `onConflictDo` (do nothing) cannot be combined with `returning`; the helper
  throws.
- For upserts, `buildConflictUpdateColumns(table, cols)` sets each listed column
  to the incoming value. List the columns to overwrite.
