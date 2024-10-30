import type { ScrapedAuthorData } from "../../types";
import { getScrapedDirInfo, getScrapedDirsContents } from "../../utils/common";
import { type InsertAuthor, insertAuthor } from "../queries/insert";
import { authors } from "../schema";

async function main() {
	const baseDir = "./scraped_data";
	const subDir = "authors";
	const contents = await getScrapedDirsContents(baseDir, subDir);
	const dirs = await getScrapedDirInfo(baseDir, subDir, contents);

	for (const dir of dirs) {
		const { id, dataFilePath } = dir;

		const { created, data } = (await Bun.file(
			dataFilePath,
		).json()) as ScrapedAuthorData;

		const newAuthor: InsertAuthor = {
			username: data.username,
			email: data.email,
			dataCreatedAt: new Date(created),
			dataUpdatedAt: new Date(created),
			firstName: data.firstName,
			lastName: data.lastName,
			affiliation: data.affiliation,
			website: data.website,
		};

		const res = await insertAuthor(newAuthor, {
			returning: { authorId: authors.authorId, username: authors.username },
		});

		if (res.length === 0) {
			console.log(`${id} already exists`);
		} else {
			console.log(`Inserted ${res[0].authorId} (${res[0].username})`);
		}
	}
}

main();
