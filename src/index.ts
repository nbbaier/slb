import { exists, mkdir, writeFile } from "node:fs/promises";
import { BASE_URL } from "./config";
import type { ExtendedAuthor, ExtendedPaper } from "./types";
import { chunkArray, generateUrls, getPageRows } from "./utils/common";
import { extractDataFromRow } from "./utils/extractors";
import { fetchAuthorData, fetchPaperData } from "./utils/fetchers";
import { writeAuthorData, writePaperData } from "./utils/writers";

async function main() {
  const urlsToScrape = await generateUrls(BASE_URL);
  console.log(`URLs to scrape = ${urlsToScrape.length}`);
  console.log("Generated URLs:", urlsToScrape);

  await mkdir("./logs", { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFile = `./logs/scrape-${timestamp}.log`;

  await writeFile(
    logFile,
    `Scraping started at ${new Date().toISOString()}\nURLs to scrape: ${urlsToScrape.length}\n\n`,
    { flag: "a" },
  );

  for (const url of urlsToScrape) {
    const startTime = performance.now();
    const { rows, totalRows } = await getPageRows(url);
    const chunkedRows = chunkArray(rows, 10);
    let processedRows = 0;

    console.log(`Starting to scrape ${url} (${totalRows} rows)`);
    await writeFile(logFile, `\nProcessing ${url} (${totalRows} rows)\n`, {
      flag: "a",
    });

    for (const chunk of chunkedRows) {
      await Promise.all(
        chunk.map(async (row: HTMLTableRowElement) => {
          const rowStartTime = performance.now();
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

              if (await exists(paperFolderPath)) {
                const rowEndTime = performance.now();
                const rowTime = rowEndTime - rowStartTime;
                const logMessage = `[${new Date().toISOString()}] Row ${processedRows + 1}/${totalRows}: Skipped paper ${id} (${rowTime.toFixed(2)}ms)\n`;
                await writeFile(logFile, logMessage, { flag: "a" });
                return;
              }

              try {
                const paperResult = await fetchPaperData(paperURL, id);

                if (paperResult === null) {
                  const rowEndTime = performance.now();
                  const rowTime = rowEndTime - rowStartTime;
                  const logMessage = `[${new Date().toISOString()}] Row ${processedRows + 1}/${totalRows}: No paper data found for ${id} (${rowTime.toFixed(2)}ms)\n`;
                  await writeFile(logFile, logMessage, { flag: "a" });
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

                const rowEndTime = performance.now();
                const rowTime = rowEndTime - rowStartTime;
                const logMessage = `[${new Date().toISOString()}] Row ${processedRows + 1}/${totalRows}: Processed paper ${id} (${rowTime.toFixed(2)}ms)\n`;
                await writeFile(logFile, logMessage, { flag: "a" });
              } catch (error) {
                const rowEndTime = performance.now();
                const rowTime = rowEndTime - rowStartTime;
                const logMessage = `[${new Date().toISOString()}] Row ${processedRows + 1}/${totalRows}: Error processing paper ${id}: ${error} (${rowTime.toFixed(2)}ms)\n`;
                await writeFile(logFile, logMessage, { flag: "a" });
                console.log(`Error fetching paper data for ${id}: ${error}`);
              }
            } else {
              const rowEndTime = performance.now();
              const rowTime = rowEndTime - rowStartTime;
              const logMessage = `[${new Date().toISOString()}] Row ${processedRows + 1}/${totalRows}: No row data extracted (${rowTime.toFixed(2)}ms)\n`;
              await writeFile(logFile, logMessage, { flag: "a" });
              console.log("No row data extracted");
            }
            processedRows++;
          } catch (error) {
            const rowEndTime = performance.now();
            const rowTime = rowEndTime - rowStartTime;
            const logMessage = `[${new Date().toISOString()}] Row ${processedRows + 1}/${totalRows}: Error processing row: ${error} (${rowTime.toFixed(2)}ms)\n`;
            await writeFile(logFile, logMessage, { flag: "a" });
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

    const logMessage = `[${new Date().toISOString()}] ${url}: Processed ${processedRows} rows in ${totalTime.toFixed(2)}ms ${timePerRowMsg}\n`;
    console.log(logMessage.trim());
    await writeFile(logFile, logMessage, { flag: "a" });
  }

  await writeFile(
    logFile,
    `\nScraping completed at ${new Date().toISOString()}\n`,
    { flag: "a" },
  );
}

await main();
