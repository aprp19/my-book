import type { BrowseFilters, BrowseFeed } from "@/lib/providers/types";
import type { MangaProviderType } from "@/types";

export const queryKeys = {
  search: (q: string) => ["search", q] as const,
  browse: (feed: BrowseFeed, page: number, filters?: BrowseFilters) =>
    filters && Object.keys(filters).length > 0
      ? (["browse", feed, page, filters] as const)
      : (["browse", feed, page] as const),
  manga: (provider: MangaProviderType, id: string) => ["manga", provider, id] as const,
  chapters: (provider: MangaProviderType, id: string) =>
    ["chapters", provider, id] as const,
  pages: (provider: MangaProviderType, chapterId: string) =>
    ["pages", provider, chapterId] as const,
  favorites: () => ["user", "favorites"] as const,
  continueReading: () => ["user", "continue-reading"] as const,
  recentChapters: () => ["user", "recent-chapters"] as const,
  recentViews: () => ["user", "recent-views"] as const,
  favoriteStatus: (provider: MangaProviderType, id: string) =>
    ["user", "favorite-status", provider, id] as const,
  readingProgress: (provider: MangaProviderType, chapterId: string) =>
    ["user", "reading-progress", provider, chapterId] as const,
  mangaChapterProgress: (provider: MangaProviderType, mangaId: string) =>
    ["user", "manga-chapter-progress", provider, mangaId] as const,
};
