import {
  buildConflictUpdateColumns,
  insertPaper,
} from "../src/db/queries/insert";
import { papers } from "../src/db/schema";

const paper = {
  lingbuzzId: "1234567890",
  paperTitle: "Test Paper",
  paperYear: "2025",
  paperMonth: "January",
  paperReference: "1234567890",
  publishedIn: "Test Journal",
  keywordsRaw: "Test Keyword",
  abstract: "Test Abstract",
  downloads: 100,
  downloadUrl: "https://test.com",
  paperUrl: "https://test.com",
};

const result = await insertPaper(paper, {
  returning: { paperId: papers.paperId, lingbuzzId: papers.lingbuzzId },
  onConflictDoUpdate: {
    target: [papers.lingbuzzId],
    set: buildConflictUpdateColumns(papers, ["rowCreatedAt"]),
  },
});
console.log(result);
