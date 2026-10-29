# slb

Scrapes lingbuzz.net into `./scraped_data/`, then imports it into a Turso
(libSQL) database with Drizzle. `src/db/index.ts` and `drizzle.config.ts` read
`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` from `.env`; anything importing
`src/db` needs them. The scraper, both `insert:*` scripts and `bun run migrate`
hit the network or the live database: ask before running them.

## Data-flow invariants
- The scraper (`src/index.ts`) skips any author or paper whose folder already
  exists, so re-runs only fetch new items.
- An author's identity is the lingbuzz `username`, the unique key on `authors`.
- Import authors (`bun run insert:authors`) before papers. `createPapers.ts`
  looks each author up by username and drops the link when one is missing.
- Author order is preserved as the 1-based `authorPosition` in
  `authors_to_papers`, assigned in page order by `extractDataFromRow()`.
- A paper listing the same username twice is appended to `edge_cases.md` and
  skipped. Papers already in the database are skipped by `lingbuzzId`.

## Changing the schema
1. Edit `src/db/schema/index.ts`; update any trigger's `when` columns too.
2. `bun run generate`, then read the new file in `migrations/`.
3. If a `Trigger` changed, `bun scripts/trigger-migration.ts`; it writes a
   custom migration that drops and recreates every trigger. Read it too.
4. Apply with `bun run migrate`, after asking. `bun run gm` generates and applies
   in one step, which skips the inspection.

## Before editing `src/` or `scripts/`
Read `CODING_STANDARDS.md`.

## Done means
`bunx biome check .` passes. There are no tests yet; `bun test <path>` runs one
once they exist.
