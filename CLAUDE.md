# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a linguistics paper scraper and database project that migrates scraped data from [lingbuzz.net](https://ling.auf.net) into a SQLite database. The project consists of two main phases:

1. **Scraping Phase**: Web scraper that extracts paper and author data from lingbuzz.net, saving raw HTML and JSON to `./scraped_data/`
2. **Database Phase**: Imports scraped data into a Turso (libSQL) database using Drizzle ORM

## Development Commands

### Database Operations
- `bun run generate` - Generate Drizzle migrations from schema changes
- `bun run migrate` - Apply pending migrations to database
- `bun run gm` - Combined generate + migrate (run both in sequence)

### Data Import
- `bun run insert:authors` - Import all authors from `./scraped_data/authors/` into database
- `bun run insert:papers [start] [end]` - Import papers from `./scraped_data/papers/` (optional range: `bun src/db/procedures/createPapers.ts 0 100`)

### Scraping
- `bun src/index.ts` - Run the main scraper (creates logs in `./logs/`)

### Code Quality
- `biome check` - Run linter and formatter checks
- `biome check --write` - Auto-fix linting and formatting issues
- `biome format --write` - Format code only

## Environment Variables

Required in `.env`:
- `TURSO_DATABASE_URL` - Turso database connection URL
- `TURSO_AUTH_TOKEN` - Turso authentication token

## Architecture

### Database Schema (`src/db/schema/`)

Five tables with many-to-many relationships:

- **authors**: Author profiles (username is unique identifier, not auto-generated IDs)
- **papers**: Paper metadata (lingbuzzId is unique identifier from source)
- **keywords**: Normalized keyword list
- **authors_to_papers**: Junction table with `authorPosition` to preserve author order
- **keywords_to_papers**: Junction table linking papers to keywords

All tables have automatic timestamp tracking (`rowCreatedAt`, `rowsUpdatedAt`) via triggers.

### Custom Trigger System (`src/db/trigger.ts`)

This project implements a custom `Trigger` class for creating SQLite triggers in Drizzle ORM (which lacks native trigger support). Triggers automatically update `rowsUpdatedAt` timestamps when data changes.

Example usage in `src/db/schema/index.ts:25-43`:
```typescript
export const updateAuthorsTimestampTrigger = new Trigger({
  name: "update_authors_timestamp",
  type: "UPDATE",
  timing: "AFTER",
  on: authors,
  do: (row) => sql`UPDATE authors SET rows_updated_at = CURRENT_TIMESTAMP WHERE authorId = ${row.newRow.authorId}`,
  when: ({ newRow, oldRow }) => or(...conditions) ?? sql`1=1`
})
```

### Insert Utilities (`src/db/queries/insert.ts`)

Provides type-safe insert functions with support for:
- Returning specific columns after insert
- Conflict resolution (DO NOTHING or DO UPDATE)
- `buildConflictUpdateColumns()` - Helper for upsert operations

Example pattern:
```typescript
const query = insertAuthor(newAuthor, {
  returning: { authorId: authors.authorId, username: authors.username },
  onConflictDoUpdate: {
    target: [authors.username],
    set: buildConflictUpdateColumns(authors, ["rowCreatedAt"])
  }
})
```

### Data Flow

1. **Scraper** (`src/index.ts`):
   - Fetches paginated listings from lingbuzz.net
   - Extracts row data, fetches individual paper/author pages
   - Writes to `./scraped_data/authors/{username}/` and `./scraped_data/papers/{lingbuzzId}/`
   - Skips existing folders (idempotent)

2. **Import Procedures** (`src/db/procedures/`):
   - `createAllAuthors.ts`: Reads all author JSON files, upserts to database
   - `createPapers.ts`: Reads paper JSON files, inserts papers + relationships
   - Papers procedure requires authors to exist first

### Key Implementation Details

- **Author Uniqueness**: Authors are matched by `username` (not name), so "John Smith" with username "jsmith" is one author even if name varies
- **Author Position Tracking**: `authorPosition` in `authors_to_papers` preserves citation order
- **Duplicate Username Detection**: Papers with duplicate author usernames are logged to `edge_cases.md` and skipped (see `src/db/procedures/createPapers.ts:51-56`)
- **Snake Case Convention**: Database uses `snake_case` (configured in drizzle config via `casing: "snake_case"`)
- **Timestamp Triggers**: Automatically update `rows_updated_at` when specific columns change (see trigger definitions in schema files)

### Directory Structure

```
src/
├── index.ts                 # Main scraper entry point
├── config.ts               # Constants (BASE_URL, file paths)
├── types.ts                # TypeScript type definitions
├── db/
│   ├── index.ts            # Drizzle client initialization
│   ├── trigger.ts          # Custom Trigger class implementation
│   ├── schema/
│   │   ├── index.ts        # Table definitions + triggers
│   │   ├── relations.ts    # Drizzle relational definitions
│   │   └── sharedCols.ts   # Reusable column definitions
│   ├── queries/
│   │   ├── insert.ts       # Type-safe insert functions
│   │   ├── select.ts       # Query helpers
│   │   └── queryUtils.ts   # Query utilities
│   └── procedures/
│       ├── createAllAuthors.ts  # Author import script
│       └── createPapers.ts      # Paper import script
└── utils/
    ├── common.ts           # Shared utilities (chunking, URL generation)
    ├── extractors.ts       # HTML parsing for table rows
    ├── fetchers.ts         # HTTP fetching for papers/authors
    ├── parsers.ts          # Data transformation
    └── writers.ts          # File writing for scraped data
```

## Common Development Patterns

### Adding New Tables
1. Define table in `src/db/schema/index.ts` with `rowTimestampColumns(t)`
2. Add relations to `src/db/schema/relations.ts`
3. Create timestamp update trigger if needed
4. Add insert/select helpers to `src/db/queries/`
5. Run `bun run gm` to generate and apply migration

### Modifying Schema
1. Update table definition in `src/db/schema/index.ts`
2. Update trigger's `when` clause if new columns need timestamp tracking
3. Run `bun run gm`
4. Check generated migration in `migrations/` before applying

### Re-importing Data
- Authors: Safe to re-run `bun run insert:authors` (uses upsert)
- Papers: Check for existing records first - procedure skips papers already in DB (see `src/db/procedures/createPapers.ts:32-39`)
