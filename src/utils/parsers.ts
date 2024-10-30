import { JSDOM } from "jsdom";
import { BASE_URL } from "../../config";
import type { PreviousVersion } from "../types";
import { stripParams } from "./extractors";

export function parseCenterElement(document: Document): string[] {
	const centerElement = document.querySelector("body > center");
	if (!centerElement) return [];

	const linesWithHtml = centerElement.innerHTML.split(/<br\s*\/?>/gi);

	const lines = linesWithHtml
		.map((line) => {
			const tempDom = new JSDOM(`<div>${line}</div>`);
			return (
				tempDom.window.document.querySelector("div")?.textContent?.trim() || ""
			);
		})
		.filter(Boolean); // Filter out any empty strings

	return lines;
}

export function parseTable(
	document: Document,
	selector: string,
): Map<string, string> {
	const table = document.querySelector(selector);
	if (!table) {
		return new Map();
	}

	const tableDataMap = new Map<string, string>();
	for (const row of table.querySelectorAll("tr")) {
		const cells = Array.from(row.querySelectorAll("td"))
			.map((td) => td.textContent?.trim())
			.filter(Boolean); // This removes any falsy values, including empty strings

		if (cells.length >= 2) {
			const key = (cells[0] ?? "").replace(":", "").trim().toLocaleLowerCase();
			const value = cells[1] || "";
			tableDataMap.set(key, value);
		}
	}

	return tableDataMap;
}

export function parseTableNew(
	document: Document,
	selector: string,
): Map<string, HTMLElement> {
	const table = document.querySelector(selector);
	if (!table) {
		return new Map();
	}
	const rows = table?.querySelectorAll("tr") ?? [];
	const tableDataMap = new Map<string, HTMLElement>();

	if (rows.length === 0) {
		return tableDataMap;
	}

	for (const row of rows) {
		const cells = row.querySelectorAll("td");
		if (cells.length >= 2) {
			const key =
				cells[0].textContent?.trim().replace(":", "").toLocaleLowerCase() || "";
			const value = cells[1];

			tableDataMap.set(key, value);
		}
	}

	return tableDataMap;
}

export function parseAbstract(nodes: ChildNode[]): string {
	return nodes
		?.map((node) => node.textContent)
		.join(" ")
		.replace(/"/g, "'")
		.replace(/’/g, "'")
		.replace(/\n/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}
export function parsePreviousVersions(
	versions: HTMLElement,
): PreviousVersion[] {
	const previousVersions: PreviousVersion[] = [];

	const links = versions.querySelectorAll("a");
	for (const link of links) {
		const rawText = link.textContent?.trim() || "";

		const versionMatch = rawText.match(/^(v\d+)\s+/);
		const dateMatch = rawText.match(
			/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/,
		);

		const version = versionMatch ? versionMatch[1] : "";
		const date = dateMatch ? dateMatch[0] : "";
		const downloadURL = stripParams(`${BASE_URL}${link.href}`);

		previousVersions.push({ version, downloadURL, date });
	}
	return previousVersions;
}
