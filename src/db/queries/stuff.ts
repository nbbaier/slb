import type { ScrapedAuthorData, ScrapedPaperData } from "../../types";
import type { InsertAuthor, InsertPaper } from "./insert";

const file = Bun.file("scraped_data/papers/000004/000004_data.json");
const { data, created, updated } = (await file.json()) as ScrapedPaperData;

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

console.log(newPaper);

const authorList: InsertAuthor[] = await Promise.all(
	Object.entries(data.authors)
		.map((entry) => ({
			username: entry[1].username,
		}))
		.map(async (author) => {
			const authorFile = Bun.file(
				`scraped_data/authors/${author.username}/${author.username}_data.json`,
			);
			const { created: dataCreatedAt, data: authorData } =
				(await authorFile.json()) as ScrapedAuthorData;
			const { username: _, ...rest } = authorData;
			return {
				...author,
				dataCreatedAt: new Date(dataCreatedAt),
				dataUpdatedAt: new Date(dataCreatedAt),
				...rest,
			};
		}),
);

// async function getPaperIdByLingbuzzId(targetLingbuzzId: string) {
// 	return await db.query.papers.findFirst({
// 		columns: { paperId: true },
// 		where: eq(papers.lingbuzzId, targetLingbuzzId),
// 	});
// }

// async function getAuthorIdByUsername(targetUsername: string) {
// 	return await db.query.authors.findFirst({
// 		columns: { authorId: true },
// 		where: eq(authors.username, targetUsername),
// 	});
// }

// async function createNewPaperAuthor(data: ExtendedPaper) {
// 	const newPaperAuthors: InsertAuthorPaper[] = [];
// 	for (const [position, author] of Object.entries(data.authors)) {
// 		const targetUsername = author.username;
// 		const targetLingbuzzId = data.id;
// 		const paperIdResult = await getPaperIdByLingbuzzId(targetLingbuzzId);
// 		const authorIdResult = await getAuthorIdByUsername(targetUsername);
// 		if (!paperIdResult || !authorIdResult) {
// 			continue;
// 		}
// 		newPaperAuthors.push({
// 			authorPosition: Number(position),
// 			paperId: paperIdResult?.paperId,
// 			authorId: authorIdResult?.authorId,
// 		});
// 	}
// 	return newPaperAuthors;
// }

// for (const insert of await createNewPaperAuthor(data)) {
// 	const result = await db.insert(authorsToPapers).values(insert);

// 	console.log(result);
// }
