import { relations } from "drizzle-orm";
import { sqliteTable } from "drizzle-orm/sqlite-core";

export const authors = sqliteTable("authors", (t) => ({
	authorId: t.integer().primaryKey(),
	firstName: t.text(),
	lastName: t.text(),
}));

export const papers = sqliteTable("papers", (t) => ({
	paperId: t.integer().primaryKey(),
}));

export const authorsToPapers = sqliteTable("authors_to_papers", (t) => ({
	authorId: t
		.integer()
		.notNull()
		.references(() => authors.authorId),
	paperId: t
		.integer()
		.notNull()
		.references(() => papers.paperId),
}));

export const authorsRelations = relations(authors, ({ one, many }) => ({
	authorsToPapers: many(authorsToPapers),
}));

export const papersRelations = relations(papers, ({ many }) => ({
	authorsToPapers: many(authorsToPapers),
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
