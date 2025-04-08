import { exists } from "node:fs/promises";
import { BASE_URL } from "./config";
import type { ExtendedAuthor, ExtendedPaper } from "./types";
import { chunkArray, generateUrls, getPageRows } from "./utils/common";
import { extractDataFromRow } from "./utils/extractors";
import { fetchAuthorData, fetchPaperData } from "./utils/fetchers";
import { writeAuthorData, writePaperData } from "./utils/writers";

async function main() {
	const urlsToScrape = await generateUrls(BASE_URL);
	console.log(`URLs to scrape = ${urlsToScrape.length}`);

	for (const url of urlsToScrape) {
		const startTime = performance.now();
		const rows = await getPageRows(url);
		const chunkedRows = chunkArray(rows, 10);
		let processedRows = 0;

		console.log(`Starting to scrape ${url}`);

		for (const chunk of chunkedRows) {
			await Promise.all(
				chunk.map(async (row: HTMLTableRowElement) => {
					try {
						const rowHTML = row.innerHTML;
						const rowData = extractDataFromRow(row);
						if (rowData !== null) {
							const { authors } = rowData;
							for (const author of Object.values(authors)) {
								const authorFolderPath = `./scraped_data/authors/${author.username}`;

								if (await exists(authorFolderPath)) continue;

								const { authorUrl } = author;
								const { authorPageHTML, email, affiliation, website } =
									await fetchAuthorData(authorUrl);

								const authorData: ExtendedAuthor = {
									firstName: author.firstName,
									lastName: author.lastName,
									username: author.username,
									authorUrl,
									email,
									affiliation,
									website,
								};

								await writeAuthorData(
									authorFolderPath,
									authorData,
									authorPageHTML,
								);
							}

							const { id, title, paperURL, downloadURL } = rowData;
							const paperFolderPath = `./scraped_data/papers/${id}`;

							if (await exists(paperFolderPath)) return;

							try {
								const paperResult = await fetchPaperData(paperURL, id, true);

								if (paperResult === null) {
									console.log(`No paper data found for ${id}`);
									return;
								}

								const {
									paperPageHTML,
									date,
									publishedIn,
									keywords,
									keywordsRaw,
									abstract,
									downloads,
								} = paperResult;

								const paperData: ExtendedPaper = {
									id,
									title,
									authors,
									date,
									publishedIn,
									keywords,
									keywordsRaw,
									abstract,
									downloads,
									downloadURL,
									paperURL,
									previousVersions: [],
								};

								await writePaperData(
									paperFolderPath,
									rowHTML,
									paperPageHTML,
									paperData,
								);
							} catch (error) {
								console.log(`Error fetching paper data for ${id}: ${error}`);
							}
						} else {
							console.log("No row data extracted");
						}
						processedRows++;
					} catch (error) {
						console.log(`Error processing row: ${error}`);
					}
				}),
			);
		}

		const endTime = performance.now();
		const totalTime = endTime - startTime;
		const timePerRowMsg =
			processedRows > 0
				? `(${(totalTime / processedRows).toFixed(2)}ms per row)`
				: "";

		console.log(
			`Processed ${processedRows} rows in ${totalTime.toFixed(2)}ms ${timePerRowMsg}`,
		);
	}
}

await main();
