import { JSDOM } from "jsdom";
import { BASE_URL } from "../config";
import { FetchError, type PreviousVersion } from "../types";
import { isPaperFound, splitKeywords, stripParams } from "./common";
import { getNodesBetween } from "./extractors";
import { parseAbstract, parseCenterElement, parseTableNew } from "./parsers";

export async function fetchHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new FetchError(`Failed to fetch ${url}: ${res.statusText}`);
    }
    return res.text();
  } catch (error) {
    console.error(error);
    throw new FetchError(`Error fetching HTML from ${url}`);
  }
}

export async function fetchAuthorData(authorUrl: string): Promise<{
  authorPageHTML: string;
  email: string;
  affiliation: string;
  website: string;
}> {
  const authorPageHTML = await fetchHtml(authorUrl);
  const document = new JSDOM(authorPageHTML).window.document;

  const email =
    document
      .querySelector("body > table > tbody > tr:nth-child(2) > td.value")
      ?.textContent?.replace(" @ ", "@") || "";
  const affiliation =
    document.querySelector("body > table > tbody > tr:nth-child(3) > td.value")
      ?.textContent || "";
  const website =
    document.querySelector("body > table > tbody > tr:nth-child(4) > td.value")
      ?.textContent || "";

  return { authorPageHTML, email, affiliation, website };
}

export async function fetchPaperData(
  paperURL: string,
  id: string,
  logging = false,
): Promise<{
  paperPageHTML: string;
  date: string;
  publishedIn: string;
  keywords: string[];
  keywordsRaw: string;
  abstract: string;
  downloads: number;
  previousVersions: PreviousVersion[];
} | null> {
  logging && console.log(`Getting paper ${id}`);
  const paperPageHTML = await fetchHtml(paperURL);
  const document = new JSDOM(paperPageHTML).window.document;

  if (!isPaperFound(document)) {
    logging && console.log(`No paper found for ${id}`);
    return null;
  }

  const header = parseCenterElement(document);
  const date = header[2] ? header[2].trim() : "";

  const tableRows = parseTableNew(document, "body > table");
  const publishedIn = tableRows.get("published in")?.textContent || "";
  const keywordsRaw = tableRows.get("keywords")?.textContent || "";
  const downloads = tableRows.get("downloaded")?.textContent
    ? Number.parseInt(
        tableRows.get("downloaded")?.textContent?.split(" ")[0] as string,
        10,
      )
    : 0;

  const versions = tableRows.get("previous versions");
  const previousVersions: PreviousVersion[] = [];

  if (versions) {
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
  }

  const rawAbstract = getNodesBetween(document, {
    start: "center",
    end: "table",
  });

  const abstract = rawAbstract ? parseAbstract(rawAbstract as ChildNode[]) : "";

  return {
    paperPageHTML,
    date,
    publishedIn,
    keywords: splitKeywords(keywordsRaw),
    keywordsRaw,
    abstract,
    previousVersions,
    downloads,
  };
}

export async function getFrontPageIds(): Promise<number[]> {
  const frontPageHTML = await fetchHtml(BASE_URL);
  const document = new JSDOM(frontPageHTML).window.document;

  const mainTable = document.body
    .querySelectorAll("table")[2]
    .querySelector("td > table");

  const regex = /\/lingbuzz\/(\d{6})/;

  const hrefs = Array.from(mainTable?.querySelectorAll("a") || [])
    .map((a) => a.href)
    .filter((href) => regex.test(href)) // filter hrefs that match the regex
    .map((href) => {
      const match = regex.exec(href);
      return match ? match[1] : ""; // return the first capturing group (the 6-digit number)
    })
    .map((id) => Number.parseInt(id, 10))
    .filter((v, i, a) => a.indexOf(v) === i); // remove duplicates

  return hrefs;
}
