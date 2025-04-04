import { eq } from "drizzle-orm";
import db from "..";
import {
	type authors,
	authorsToPapers,
	keywords,
	keywordsToPapers,
	papers,
} from "../schema";
import { removeTimeColumns } from "./queryUtils";

export type SelectPaper = typeof papers.$inferSelect;
export type SelectAuthor = typeof authors.$inferSelect;
export type SelectAuthorWithoutTime = Omit<
	typeof authors.$inferSelect,
	"rowCreatedAt" | "rowUpdatedAt" | "dataCreatedAt" | "dataUpdatedAt"
>;
export type SelectKeyword = typeof keywords.$inferSelect;

/// AUTHORS ///
export async function selectAuthors({
	limit,
}: { limit?: number } = {}): Promise<SelectAuthor[]> {
	const result = await db.query.authors.findMany({
		limit,
	});
	return result;
}

export async function selectAuthorByUsername(username: string) {
	const result = await db.query.authors.findFirst({
		where: (authors, { eq }) => eq(authors.username, username),
	});
	return result;
}

export async function selectAuthorByEmail(email: string) {
	const result = await db.query.authors.findFirst({
		where: (authors, { eq }) => eq(authors.email, email),
	});
	return result;
}

/// KEYWORDS ///
export async function selectKeywords({
	limit,
}: { limit?: number } = {}): Promise<SelectKeyword[]> {
	const result = await db.query.keywords.findMany({
		limit,
	});
	return result;
}

export async function selectKeywordId(keyword: string) {
	const result = await db.query.keywords.findFirst({
		where: (keywords, { eq }) => eq(keywords.keyword, keyword),
	});
	return result?.keywordId;
}

/// PAPERS ///
export async function selectPapers({
	limit,
}: { limit?: number } = {}): Promise<SelectPaper[]> {
	const result = await db.query.papers.findMany({
		with: {
			authorsToPapers: { columns: { authorId: true, authorPosition: true } },
			keywordsToPapers: { columns: { keywordId: true } },
		},
		limit,
	});
	return result;
}

export async function selectPaperByLingbuzzId(lingbuzzId: string) {
	const result = await db.query.papers.findFirst({
		where: (papers, { eq }) => eq(papers.lingbuzzId, lingbuzzId),
	});
	return result;
}

export async function selectPapersByAuthorId(
	authorId: number,
	{ limit }: { limit?: number } = {},
) {
	const coreQuery = db
		.select({
			...removeTimeColumns(papers),
		})
		.from(papers)
		.innerJoin(authorsToPapers, eq(papers.paperId, authorsToPapers.paperId))
		.where(eq(authorsToPapers.authorId, authorId));

	const result = limit ? await coreQuery.limit(limit) : await coreQuery;

	return result;
}

export async function selectPapersByKeyword(
	keyword: string,
	{ limit }: { limit?: number } = {},
) {
	const coreQuery = db
		.select({
			...removeTimeColumns(papers),
		})
		.from(papers)
		.innerJoin(keywordsToPapers, eq(papers.paperId, keywordsToPapers.paperId))
		.innerJoin(keywords, eq(keywordsToPapers.keywordId, keywords.keywordId))
		.where(eq(keywords.keyword, keyword));

	const result = limit ? await coreQuery.limit(limit) : await coreQuery;

	return result;
}
