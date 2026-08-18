import type { MangaProviderType } from "./manga";

export interface Chapter {
  id: string;
  mangaId: string;
  provider: MangaProviderType;
  number: string | null;
  title: string | null;
  volume: string | null;
  language: string | null;
  publishedAt: string | null;
}

export interface Page {
  index: number;
  imageUrl: string;
}

export interface ChapterListResult {
  chapters: Chapter[];
  hasMore: boolean;
}
