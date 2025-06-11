import type { ResultSet } from "@libsql/client";
import type { IndexColumn, SQLiteColumn } from "drizzle-orm/sqlite-core";
import db from "..";
import {
  authors,
  authorsToPapers,
  keywordsToPapers,
  keywords,
  papers,
  type DatabaseTable,
} from "../schema/";

type Paper = typeof papers.$inferSelect;
type Author = typeof authors.$inferSelect;
type Keyword = typeof keywords.$inferSelect;
type AuthorPaper = typeof authorsToPapers.$inferSelect;
type KeywordPaper = typeof keywordsToPapers.$inferSelect;

export type InsertPaper = typeof papers.$inferInsert;
export type InsertAuthor = typeof authors.$inferInsert;
export type InsertKeyword = typeof keywords.$inferInsert;
export type InsertAuthorsPaper = typeof authorsToPapers.$inferInsert;
export type InsertKeywordsPaper = typeof keywordsToPapers.$inferInsert;

async function insertIntoTable<
  TableSelect,
  TableInsert extends {
    rowCreatedAt?: Date | null;
    rowUpdatedAt?: Date | null;
  },
  T extends
    | Partial<Record<keyof TableSelect, SQLiteColumn>>
    | undefined = undefined,
>(
  table: DatabaseTable,
  data: TableInsert,
  {
    returning,
    onConflictDo,
  }: {
    returning?: NonNullable<T>;
    onConflictDo?: { target: IndexColumn | IndexColumn[] };
  } = {},
): Promise<
  T extends Record<string, SQLiteColumn>
    ? { [K in keyof T & keyof TableSelect]: TableSelect[K] }[]
    : ResultSet
> {
  if (onConflictDo && returning) {
    throw new Error("Cannot use both returning and onConflictDo");
  }

  const coreStatement = db.insert(table).values(data);

  if (onConflictDo) {
    const result = await coreStatement.onConflictDoNothing(onConflictDo);
    return result as unknown as T extends Record<string, SQLiteColumn>
      ? { [K in keyof T & keyof TableSelect]: TableSelect[K] }[]
      : ResultSet;
  }

  if (returning) {
    const definedColumns = Object.values(returning).filter(
      (col): col is SQLiteColumn => col !== undefined,
    );
    const result = await coreStatement.returning(
      Object.fromEntries(definedColumns.map((col) => [col.name, col])),
    );
    return result as unknown as T extends Record<string, SQLiteColumn>
      ? { [K in keyof T & keyof TableSelect]: TableSelect[K] }[]
      : ResultSet;
  }
  return coreStatement as unknown as T extends Record<string, SQLiteColumn>
    ? { [K in keyof T & keyof TableSelect]: TableSelect[K] }[]
    : ResultSet;
}

export function insertPaper<
  T extends Partial<Record<keyof Paper, SQLiteColumn>> | undefined = undefined,
>(
  paper: InsertPaper,
  options?: {
    returning?: T;
    onConflictDo?: { target: IndexColumn | IndexColumn[] };
  },
) {
  return insertIntoTable<Paper, InsertPaper, T>(papers, paper, options);
}

export function insertAuthor<
  T extends Partial<Record<keyof Author, SQLiteColumn>> | undefined = undefined,
>(
  author: InsertAuthor,
  options?: {
    returning?: T;
    onConflictDo?: { target: IndexColumn | IndexColumn[] };
  },
) {
  return insertIntoTable<Author, InsertAuthor, T>(authors, author, options);
}

export function insertKeyword<
  T extends
    | Partial<Record<keyof Keyword, SQLiteColumn>>
    | undefined = undefined,
>(
  keyword: InsertKeyword,
  options?: {
    returning?: T;
    onConflictDo?: { target: IndexColumn | IndexColumn[] };
  },
) {
  return insertIntoTable<Keyword, InsertKeyword, T>(keywords, keyword, options);
}

export function insertAuthorsPapers<
  T extends
    | Partial<Record<keyof AuthorPaper, SQLiteColumn>>
    | undefined = undefined,
>(
  authorsPaper: InsertAuthorsPaper,
  options?: {
    returning?: T;
    onConflictDo?: { target: IndexColumn | IndexColumn[] };
  },
) {
  return insertIntoTable<AuthorPaper, InsertAuthorsPaper, T>(
    authorsToPapers,
    authorsPaper,
    options,
  );
}

export function insertKeywordsPapers<
  T extends
    | Partial<Record<keyof KeywordPaper, SQLiteColumn>>
    | undefined = undefined,
>(
  keywordsPaper: InsertKeywordsPaper,
  options?: {
    returning?: T;
    onConflictDo?: { target: IndexColumn | IndexColumn[] };
  },
) {
  return insertIntoTable<KeywordPaper, InsertKeywordsPaper, T>(
    keywordsToPapers,
    keywordsPaper,
    options,
  );
}
