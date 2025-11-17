import { upsertPaper } from "../src/db/queries/insert";

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

const result = await upsertPaper(paper);
console.log(result.sql);
