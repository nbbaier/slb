import { mkdir, writeFile } from "node:fs/promises";
import type { ExtendedAuthor, ExtendedPaper } from "../types";

async function writeToFile(file: string, data: string) {
	if (process.versions.bun) {
		await Bun.write(file, data);
	} else {
		await writeFile(file, data);
	}
}

export async function writeAuthorData(
	authorFolderPath: string,
	authorData: ExtendedAuthor,
	authorPageHTML: string,
) {
	await mkdir(authorFolderPath, { recursive: true });
	await writeToFile(`${authorFolderPath}/index.html`, authorPageHTML);
	await writeToFile(
		`${authorFolderPath}/${authorData.username}_data.json`,
		JSON.stringify({ created: Date.now(), data: authorData }),
	);
}

export async function writePaperData(
	paperFolderPath: string,
	rowHTML: string,
	paperPageHTML: string,
	paperData: ExtendedPaper,
) {
	await mkdir(paperFolderPath, { recursive: true });
	await writeToFile(`${paperFolderPath}/row.html`, `<tr>${rowHTML}</tr>`);
	await writeToFile(`${paperFolderPath}/index.html`, paperPageHTML);
	await writeToFile(
		`${paperFolderPath}/${paperData.id}_data.json`,
		JSON.stringify({
			created: Date.now(),
			updated: Date.now(),
			data: paperData,
		}),
	);
}
