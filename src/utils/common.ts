import { readdir } from "node:fs/promises";
import type { Dirent } from "node:fs";
import { JSDOM } from "jsdom";
import { join } from "node:path/posix";
import { fetchHtml } from "./fetchers";
import { BASE_URL } from "../../config";

export async function getPaperCount(BASE_URL: string): Promise<number> {
	const html = await fetchHtml(BASE_URL);
	const document = new JSDOM(html).window.document;

	const paperCountElement = document.body.querySelector("center > b > a");

	if (!paperCountElement) throw new Error("Paper count element not found");

	const textContent = paperCountElement.textContent || "";
	const numbers = textContent.match(/\d+/g)?.map(Number) || [];
	const paperCount = numbers.at(-1);

	if (!paperCount) throw new Error("Paper count not found");

	return paperCount;
}

export function isPaperFound(document: Document): boolean {
	const pageTitle = document.querySelector("title")?.textContent || "";
	return pageTitle !== "lingbuzz - archive of linguistics articles";
}

export function splitKeywords(inputString: string): string[] {
	const splitRegex = /[,;](?![^{\[\(<]*[\]\)}>])/;
	const resplitRegex = / ·||\/ /;
	return inputString
		.split(splitRegex)
		.flatMap((s) => s.split(resplitRegex))
		.map((s) => s.trim());
}

export async function generateUrls(
	baseURL: string,
	options?: { customLimit?: number; pageSize?: number },
): Promise<string[]> {
	const limit = options?.customLimit || (await getPaperCount(baseURL));
	const pageSize = options?.pageSize || 100;

	const urls: string[] = [];
	let start = 1;

	while (start <= limit) {
		urls.push(`${baseURL}/lingbuzz/_listing?start=${start}`);

		if (start === 1) {
			start = 31;
		} else {
			start += pageSize;
		}
	}

	return urls;
}

export async function getPageRows(url: string): Promise<HTMLTableRowElement[]> {
	const html = await fetchHtml(BASE_URL);
	const document = new JSDOM(html).window.document;

	const mainTable = document.body
		.querySelectorAll("table")[2]
		.querySelector("td > table");

	if (!mainTable) {
		console.error("Main table not found");
		process.exit(1);
	}

	const rows = mainTable.querySelectorAll("tr");

	if (rows.length === 0) {
		console.error("No rows found in the main table");
		process.exit(1);
	}

	return Array.from(rows);
}
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
	const results = [];
	while (array.length) {
		results.push(array.splice(0, chunkSize));
	}
	return results;
}

export async function getScrapedDirsContents(baseDir: string, subDir: string) {
	const contents = await readdir(join(baseDir, subDir), {
		withFileTypes: true,
	});

	return contents;
}

export async function getScrapedDirInfo(
	baseDir: string,
	subDir: string,
	contents: Dirent[],
): Promise<{ id: string; dataFilePath: string; htmlFilePath: string }[]> {
	const fullDir = join(baseDir, subDir);
	const dirs = contents
		.filter((item) => item.isDirectory())
		.map((item) => ({
			id: item.name,
			dataFilePath: join(fullDir, item.name, `${item.name}_data.json`),
			htmlFilePath: join(fullDir, item.name, "index.html"),
		}));
	return dirs;
}

export type Prettify<T> = {
	[k in keyof T]: T[k];
} & {};
