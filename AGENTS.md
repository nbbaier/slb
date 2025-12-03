# Agent Guidelines

## Commands
- **Run**: `bun src/index.ts`
- **Test**: `bun test` (Run single: `bun test <path/to/test>`)
- **Lint/Format**: `bunx biome check --write .`
- **Database**: `bun run gm` (Generate migration & migrate)

## Code Style
- **Runtime**: Bun. Use `bun` CLI and APIs.
- **Language**: TypeScript. Use `import type` for types.
- **Imports**: Use `node:` prefix for Node built-ins (e.g., `node:fs`).
- **Naming**: camelCase for vars/funcs, PascalCase for types/components.
- **Formatting**: Strict adherence to Biome. Run formatter before committing.
- **Database**: Drizzle ORM w/ SQLite. Schema in `src/db/schema`.
- **Architecture**: Modular `src/` structure (db, utils, types).
- **Async**: Prefer `async/await`. Handle errors with `try/catch` in side-effects.
- **Files**: specific file names: `*.ts`.
