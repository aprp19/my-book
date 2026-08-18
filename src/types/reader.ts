import type { MangaProviderType } from "./manga";

export interface ReadingProgressPayload {
  provider: MangaProviderType;
  externalMangaId: string;
  externalChapterId: string;
  chapterNumber: string | null;
  page: number;
  mangaTitle?: string;
}

export interface FavoritePayload {
  provider: MangaProviderType;
  externalMangaId: string;
  title: string;
  coverUrl: string | null;
}

export interface MangaViewPayload {
  provider: MangaProviderType;
  externalMangaId: string;
  title: string;
  coverUrl: string | null;
}

export interface ContinueReadingItem {
  provider: MangaProviderType;
  externalMangaId: string;
  externalChapterId: string;
  chapterNumber: string | null;
  page: number;
  mangaTitle: string;
  coverUrl: string | null;
  updatedAt: string;
}

export interface RecentChapterItem {
  provider: MangaProviderType;
  externalMangaId: string;
  externalChapterId: string;
  chapterNumber: string | null;
  page: number;
  mangaTitle: string;
  updatedAt: string;
}

export interface RecentMangaViewItem {
  provider: MangaProviderType;
  externalMangaId: string;
  title: string;
  coverUrl: string | null;
  viewedAt: string;
}
