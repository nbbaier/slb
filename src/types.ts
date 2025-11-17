export interface BaseAuthor {
  firstName: string;
  lastName: string;
  authorUrl: string;
  username: string;
}

export interface ExtendedAuthor extends BaseAuthor {
  email: string;
  affiliation: string;
  website: string;
}

export interface BasePaper {
  id: string;
  title: string;
  status?: string;
  authors: Record<number, BaseAuthor>;
  downloadURL: string;
  paperURL: string;
}

export interface ExtendedPaper extends BasePaper {
  date: string;
  publishedIn: string;
  keywords: string[];
  keywordsRaw: string;
  abstract: string;
  downloads: number;
  previousVersions: PreviousVersion[];
}

export interface PreviousVersion {
  version: string;
  downloadURL: string;
  date: string;
}

export class FetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchError";
  }
}

export interface ScrapedPaperData {
  created: number;
  updated: number;
  data: ExtendedPaper;
}

export interface ScrapedAuthorData {
  created: number;
  data: ExtendedAuthor;
}
