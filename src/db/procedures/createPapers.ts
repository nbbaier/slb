import { appendFile } from "node:fs/promises";
import { db } from "..";
import type { ScrapedPaperData } from "../../types";
import { getScrapedDirInfo, getScrapedDirsContents } from "../../utils/common";
import {
	type InsertAuthorsPaper,
	type InsertKeywordsPaper,
	type InsertPaper,
	insertAuthorsPapers,
	insertKeyword,
	insertKeywordsPapers,
	insertPaper,
} from "../queries/insert";
import {
	type SelectAuthorWithoutTime,
	selectAuthorByUsername,
	selectKeywordId,
} from "../queries/select";
import { keywords, papers } from "../schema";

async function main() {
	const baseDir = "./scraped_data";
	const subDir = "papers";
	const contents = await getScrapedDirsContents(baseDir, subDir);
	const dirs = await getScrapedDirInfo(baseDir, subDir, contents);

	const [start, end] = Bun.argv.slice(2).map(Number);

	for (const dir of dirs.slice(start, end ?? dirs.length)) {
		const { id, dataFilePath } = dir;

		const check = await db.query.papers.findFirst({
			where: (papers, { eq }) => eq(papers.lingbuzzId, id),
		});

		if (check) {
			console.log(`${id} already exists, skipping`);
			continue;
		}

		console.log(`${id} does not exist, inserting`);

		const { created, updated, data } = (await Bun.file(
			dataFilePath,
		).json()) as ScrapedPaperData;

		const authorsList = Object.values(data.authors);
		const uniqueUsernames = new Set(
			authorsList.map((author) => author.username),
		);
		if (authorsList.length > 1 && uniqueUsernames.size !== authorsList.length) {
			const msg = `${id} has two of the same username`;
			console.log(`${msg} skipping`);
			await appendFile("./edge_cases.md", `${msg}\n`);
			continue;
		}

		const newPaper: InsertPaper = {
			lingbuzzId: data.id,
			paperTitle: data.title,
			paperYear: data.date.split(" ")[1],
			paperMonth: data.date.split(" ")[0],
			publishedIn: data.publishedIn,
			keywordsRaw: data.keywordsRaw,
			dataCreatedAt: new Date(created),
			dataUpdatedAt: new Date(updated),
			paperReference: `lingbuzz/${data.id}`,
			abstract: data.abstract,
			downloads: data.downloads,
			downloadUrl: data.downloadURL,
			paperUrl: data.paperURL,
		};

		const paperInsertResult = await insertPaper(newPaper, {
			returning: { paperId: papers.paperId },
		});

		const keywordPaperMappings: InsertKeywordsPaper[] = [];

		for (const keyword of [...new Set(data.keywords)]) {
			const result = await insertKeyword(
				{ keyword },
				{ onConflictDo: { target: keywords.keyword } },
			);
			const keywordId = await selectKeywordId(keyword);
			if (!keywordId) {
				throw new Error(`No keywordId found for keyword: ${keyword}`);
			}

			keywordPaperMappings.push({
				keywordId,
				paperId: paperInsertResult[0].paperId,
			});
		}

		for (const keyword of keywordPaperMappings) {
			try {
				await insertKeywordsPapers(keyword);
			} catch (error) {
				console.error(
					`Failed to insert keyword-paper relation for keywordId: ${keyword.keywordId}, paperId: ${keyword.paperId}:`,
					error,
				);
			}
		}
		const authorPaperMappings: InsertAuthorsPaper[] = [];

		for (const [authorPosition, authorData] of Object.entries(data.authors)) {
			let authorMedatadata: SelectAuthorWithoutTime;

			try {
				const result = await selectAuthorByUsername(authorData.username);
				if (!result) {
					throw new Error(
						`No author found for username: ${authorData.username}`,
					);
				}
				authorMedatadata = result;
			} catch (error) {
				console.error(
					`Failed to get author metadata for ${authorData.username}:`,
					error,
				);
				continue;
			}

			authorPaperMappings.push({
				authorId: authorMedatadata.authorId,
				paperId: paperInsertResult[0].paperId,
				authorPosition: Number.parseInt(authorPosition),
			});
		}

		for (const author of authorPaperMappings) {
			try {
				await insertAuthorsPapers(author);
			} catch (error) {
				console.error(
					`Failed to insert author-paper relation for authorId: ${author.authorId}, paperId: ${author.paperId}:`,
					error,
				);
			}
		}
	}
}

main();
