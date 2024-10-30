import { JSDOM } from "jsdom";
import type { ExtendedPaper, ScrapedPaperData } from "../types";
import { getScrapedPaperDirInfo, getScrapedPaperDirsContents } from "./common";
import { getNodesBetween } from "./extractors";
import { parseAbstract } from "./parsers";

async function main() {
	const baseDir = "./scraped_data/papers";
	const contents = await getScrapedPaperDirsContents(baseDir);
	const dirs = await getScrapedPaperDirInfo(baseDir, contents);

	const limit = Bun.argv[2] ? Number(Bun.argv[2]) : dirs.length;

	for (const dir of dirs.slice(0, limit)) {
		const { id, dataFilePath, htmlFilePath } = dir;

		console.log(`Processing ${id}`);

		const dataFile = Bun.file(dataFilePath);
		const paperData = JSON.parse(await dataFile.text()) as ScrapedPaperData;

		const htmlFile = Bun.file(htmlFilePath);
		const html = await htmlFile.text();

		const document = new JSDOM(html).window.document;

		const rawAbstract = getNodesBetween(document, {
			start: "center",
			end: "table",
		});

		const newAbstract = parseAbstract(rawAbstract as ChildNode[]);

		paperData.data.abstract = newAbstract;
		paperData.updated = Date.now();

		await Bun.write(dataFilePath, JSON.stringify(paperData, null, 2));
	}
}

main();
