import { mkdir } from "node:fs/promises";
import type { ExtendedAuthor, ExtendedPaper } from "../types";

export async function writeAuthorData(
	authorFolderPath: string,
	authorData: ExtendedAuthor,
	authorPageHTML: string,
) {
	await mkdir(authorFolderPath, { recursive: true });
	await Bun.write(`${authorFolderPath}/index.html`, authorPageHTML);
	await Bun.write(
		`${authorFolderPath}/${authorData.username}_data.json`,
		JSON.stringify({ created: Date.now(), data: authorData }, null, 2),
	);
}
export async function writePaperData(
	paperFolderPath: string,
	rowHTML: string,
	paperPageHTML: string,
	paperData: ExtendedPaper,
) {
	await mkdir(paperFolderPath, { recursive: true });
	await Bun.write(`${paperFolderPath}/row.html`, `<tr>${rowHTML}</tr>`);
	await Bun.write(`${paperFolderPath}/index.html`, paperPageHTML);
	await Bun.write(
		`${paperFolderPath}/${paperData.id}_data.json`,
		JSON.stringify(
			{ created: Date.now(), updated: Date.now(), data: paperData },
			null,
			2,
		),
	);
}
