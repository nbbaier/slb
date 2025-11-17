import type { ScrapedAuthorData } from "../../types";
import { getScrapedDirInfo, getScrapedDirsContents } from "../../utils/common";
import {
  buildConflictUpdateColumns,
  type InsertAuthor,
  insertAuthor,
} from "../queries/insert";
import { authors } from "../schema";

async function main() {
  const baseDir = "./scraped_data";
  const subDir = "authors";
  const contents = await getScrapedDirsContents(baseDir, subDir);
  const dirs = await getScrapedDirInfo(baseDir, subDir, contents);

  for (const dir of dirs) {
    const { id, dataFilePath } = dir;

    const { data } = (await Bun.file(dataFilePath).json()) as ScrapedAuthorData;

    const newAuthor: InsertAuthor = {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      affiliation: data.affiliation,
      website: data.website,
    };

    const query = insertAuthor(newAuthor, {
      returning: { authorId: authors.authorId, username: authors.username },
      onConflictDoUpdate: {
        target: [authors.username],
        set: buildConflictUpdateColumns(authors, ["rowCreatedAt"]),
      },
    });

    const res = await query;

    if (res.length === 0) {
      console.log(`${id} already exists`);
    } else {
      console.log(`Inserted ${res[0].authorId} (${res[0].username})`);
    }
  }
}

main();
