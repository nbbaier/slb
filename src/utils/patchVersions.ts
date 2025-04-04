import { JSDOM } from "jsdom";
import type { ScrapedPaperData } from "../types";
import { getScrapedDirInfo, getScrapedDirsContents } from "./common";
import { parsePreviousVersions, parseTableNew } from "./parsers";

async function main() {
	const baseDir = "./scraped_data";
	const contents = await getScrapedDirsContents(baseDir, "");
	const dirs = await getScrapedDirInfo(baseDir, "", contents);

	const limit = Bun.argv[2] ? Number(Bun.argv[2]) : dirs.length;

	for (const dir of dirs.slice(0, limit)) {
		const { id, dataFilePath, htmlFilePath } = dir;

		console.log(`Processing ${id}`);

		const dataFile = Bun.file(dataFilePath);
		const paperData = JSON.parse(await dataFile.text()) as ScrapedPaperData;

		const htmlFile = Bun.file(htmlFilePath);
		const html = await htmlFile.text();
		const selector = "body > table";

		const document = new JSDOM(html).window.document;
		const tableDataMap = parseTableNew(document, selector);

		paperData.updated = Date.now();

		const versions = tableDataMap.get("previous versions");

		if (versions) {
			paperData.data.previousVersions = parsePreviousVersions(versions);
		} else {
			paperData.data.previousVersions = [];
		}

		await Bun.write(dataFilePath, JSON.stringify(paperData, null, 2));
	}
}

main();
