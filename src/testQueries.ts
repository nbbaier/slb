import db from "./db";
import { eq } from "drizzle-orm";
import * as schema from "./db/schema";

const paper = await db.query.papers.findFirst({
	columns: {
		paperId: true,
		paperTitle: true,
		abstract: true,
	},
	extras: (table, { sql }) => ({
		date: sql<string>`concat(${table.paperMonth}, ' ', ${table.paperYear})`.as(
			"date",
		),
	}),
	where: eq(schema.papers.lingbuzzId, "008259"),
	with: {
		authorsToPapers: {
			columns: {
				authorPosition: true,
			},
			with: {
				author: {
					extras: (table, { sql }) => ({
						fullName:
							sql<string>`concat(${table.firstName}, ' ', ${table.lastName})`.as(
								"full_name",
							),
					}),
					columns: {},
				},
			},
		},
		keywordsToPapers: {
			columns: { keywordId: true },
			with: {
				keyword: {
					columns: {},
					extras: (table, { sql }) => ({
						kw: sql<string>`${table.keyword}`.as("keyword"),
					}),
				},
			},
		},
	},
});

if (!paper) {
	throw new Error("Paper not found");
}

const { authorsToPapers, keywordsToPapers, ...rest } = paper;

const prettyPaper = {
	...rest,
	authors: authorsToPapers.map((ap) => ap.author.fullName),
	keywords: keywordsToPapers.map((kp) => kp.keyword.kw),
};

console.log(prettyPaper);
