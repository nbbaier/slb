import { JSDOM } from "jsdom";
import { BASE_URL } from "../config";
import type { BaseAuthor, BasePaper } from "../types";
import { stripParams } from "./common";

export const extractDataFromRow = (
  row: HTMLTableRowElement,
): BasePaper | null => {
  const cells = row.querySelectorAll("td");
  if (cells.length < 4) {
    return null;
  }

  const [authorCell, statusCell, fileCell, titleCell] = cells;
  const status = statusCell.textContent?.trim() || "";
  const authorsArray = Array.from(authorCell.querySelectorAll("a")).entries();
  const authors: BaseAuthor[] = [];
  const authorsMap = new Map<number, BaseAuthor>();

  for (const [index, a] of authorsArray) {
    const nameContent = a.textContent?.trim().split(", ") || ["", ""];
    const author: BaseAuthor = {
      firstName: nameContent[1],
      lastName: nameContent[0],
      authorUrl: a.href || "",
      username: decodeURI(a.href).match(/\/_person\/(.*)/)?.[1] || "",
    };

    authors.push(author);
    authorsMap.set(index + 1, author);
  }

  const downloadURL = fileCell.querySelector("a")?.href
    ? stripParams(`${BASE_URL}${fileCell.querySelector("a")?.href}`)
    : "";
  const title = titleCell.querySelector("a")?.textContent?.trim() || "";
  const titleLink = titleCell.querySelector("a")?.href || "";
  const idMatch = titleLink.match(/\/lingbuzz\/(\d{6})/);
  const id = idMatch ? idMatch[1] : "000000";
  const paperURL = `https://ling.auf.net/lingbuzz/${id}`;

  return {
    id,
    authors: Object.fromEntries(authorsMap),
    status,
    downloadURL,
    paperURL,
    title,
  };
};

export function getNodesBetween(
  document: Document,
  { start, end }: { start: string; end: string },
) {
  const { Node } = new JSDOM().window;
  const centerElement = document.querySelector<HTMLElement>(start);
  const tableElement = document.querySelector<HTMLElement>(end);

  if (!centerElement || !tableElement) {
    console.error("Could not find <center> or <table> elements.");
    return;
  }

  let currentNode = centerElement.nextSibling; // Start from the next sibling of <center>
  const nodesBetween = [];

  // Traverse until we reach the <table>
  while (currentNode && currentNode !== tableElement) {
    // Push the current node if it's not a text node (e.g., whitespace)
    if (
      currentNode.nodeType !== Node.TEXT_NODE ||
      (currentNode.nodeValue && currentNode.nodeValue.trim() !== "")
    ) {
      nodesBetween.push(currentNode);
    }
    currentNode = currentNode.nextSibling; // Move to the next sibling
  }

  return nodesBetween;
}
