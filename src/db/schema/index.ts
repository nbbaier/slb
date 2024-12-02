import { relations, sql } from "drizzle-orm";
import { primaryKey, sqliteTable, index } from "drizzle-orm/sqlite-core";

export const authors = sqliteTable(
	"authors",
	(t) => ({
		authorId: t.integer().primaryKey(),
		firstName: t.text(),
		lastName: t.text(),
		username: t.text().unique().notNull(),
		email: t.text().notNull(),
		website: t.text(),
		affiliation: t.text(),
		dataCreatedAt: t.integer({ mode: "timestamp" }).notNull(),
		dataUpdatedAt: t.integer({ mode: "timestamp" }).notNull(),
		rowCreatedAt: t
			.integer({ mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		rowUpdatedAt: t
			.integer({ mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	}),
	(t) => {
		return {
			authorsNamesIdx: index("authors_names").on(t.lastName, t.firstName),
			authorsEmailIdx: index("authors_email").on(t.email),
		};
	},
);

export const papers = sqliteTable(
	"papers",
	(t) => ({
		paperId: t.integer().primaryKey(),
		lingbuzzId: t.text().unique().notNull(),
		paperTitle: t.text().notNull(),
		publishedIn: t.text(),
		paperYear: t.text().notNull(),
		paperMonth: t.text().notNull(),
		keywordsRaw: t.text(),
		abstract: t.text(),
		paperReference: t.text().notNull(),
		downloads: t.integer(),
		downloadUrl: t.text(),
		paperUrl: t.text(),
		dataCreatedAt: t.integer({ mode: "timestamp" }).notNull(),
		dataUpdatedAt: t.integer({ mode: "timestamp" }).notNull(),
		rowCreatedAt: t
			.integer({ mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		rowUpdatedAt: t
			.integer({ mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	}),
	(t) => {
		return {
			papersYearIdx: index("papers_year").on(t.paperYear),
			papersMonthIdx: index("papers_month").on(t.paperMonth),
			papersDateIdx: index("papers_date").on(t.paperYear, t.paperMonth),
		};
	},
);

export const keywords = sqliteTable("keywords", (t) => ({
	keywordId: t.integer().primaryKey(),
	keyword: t.text().unique().notNull(),
	rowCreatedAt: t
		.integer({ mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	rowUpdatedAt: t
		.integer({ mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
}));

export const authorsToPapers = sqliteTable(
	"authors_to_papers",
	(t) => ({
		authorId: t
			.integer()
			.notNull()
			.references(() => authors.authorId, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		paperId: t
			.integer()
			.notNull()
			.references(() => papers.paperId, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		authorPosition: t.integer().notNull(),
		rowCreatedAt: t
			.integer({ mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		rowUpdatedAt: t
			.integer({ mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	}),
	(t) => ({
		pk: primaryKey({ columns: [t.authorId, t.paperId] }),
	}),
);

export const keywordsToPapers = sqliteTable(
	"keywords_to_papers",
	(t) => ({
		keywordId: t
			.integer()
			.notNull()
			.references(() => keywords.keywordId, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		paperId: t
			.integer()
			.notNull()
			.references(() => papers.paperId, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		rowCreatedAt: t
			.integer({ mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		rowUpdatedAt: t
			.integer({ mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	}),
	(t) => ({
		pk: primaryKey({ columns: [t.keywordId, t.paperId] }),
	}),
);

export type AuthorsTable = typeof authors;
export type PapersTable = typeof papers;
export type KeywordsTable = typeof keywords;
export type AuthorsToPapersTable = typeof authorsToPapers;
export type KeywordsToPapersTable = typeof keywordsToPapers;

export type DataTimeTable = AuthorsTable | PapersTable;

export type DatabaseTable =
	| DataTimeTable
	| KeywordsTable
	| AuthorsToPapersTable
	| KeywordsToPapersTable;

export const authorsRelations = relations(authors, ({ one, many }) => ({
	authorsToPapers: many(authorsToPapers),
}));

export const papersRelations = relations(papers, ({ many }) => ({
	authorsToPapers: many(authorsToPapers),
	keywordsToPapers: many(keywordsToPapers),
}));

export const keywordsRelations = relations(keywords, ({ many }) => ({
	keywordsToPapers: many(keywordsToPapers),
}));

export const authorsToPapersRelations = relations(
	authorsToPapers,
	({ one }) => ({
		author: one(authors, {
			fields: [authorsToPapers.authorId],
			references: [authors.authorId],
		}),

		paper: one(papers, {
			fields: [authorsToPapers.paperId],
			references: [papers.paperId],
		}),
	}),
);

export const keywordsToPapersRelations = relations(
	keywordsToPapers,
	({ one }) => ({
		keyword: one(keywords, {
			fields: [keywordsToPapers.keywordId],
			references: [keywords.keywordId],
		}),
		paper: one(papers, {
			fields: [keywordsToPapers.paperId],
			references: [papers.paperId],
		}),
	}),
);
