import { infiniteQueryOptions, keepPreviousData, queryOptions } from "@tanstack/react-query";
import {
  listContinueReading,
  listFavorites,
  listRecentChapters,
  listRecentMangaViews,
  isFavorite,
  getReadingProgress,
  listMangaChapterProgress,
} from "@/lib/actions/user-data";
import { CACHE_TTL } from "@/lib/cache/fetch";
import type { BrowseFeed, BrowseFilters } from "@/lib/providers/types";
import type { Chapter, ChapterListResult, Manga, MangaProviderType, MangaSearchResult, Page } from "@/types";
import { apiGet } from "./api-client";
import { queryKeys } from "./keys";

const STALE_MS = {
  search: CACHE_TTL.search * 1000,
  pages: CACHE_TTL.pages * 1000,
  manga: CACHE_TTL.manga * 1000,
  chapters: CACHE_TTL.chapters * 1000,
} as const;

export function searchQueryOptions(query: string) {
  return queryOptions({
    queryKey: queryKeys.search(query),
    queryFn: () =>
      apiGet<MangaSearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`),
    staleTime: STALE_MS.search,
    enabled: query.trim().length >= 2,
  });
}

export function browseQueryOptions(feed: BrowseFeed, page: number, filters: BrowseFilters = {}) {
  const params = new URLSearchParams({
    feed,
    page: String(page),
  });

  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.safeMode !== undefined) params.set("safe_mode", filters.safeMode ? "1" : "0");
  if (filters.includeGenres?.length) params.set("include_genres", filters.includeGenres.join(","));
  if (filters.excludeGenres?.length) params.set("exclude_genres", filters.excludeGenres.join(","));
  if (filters.onlyCompleted) params.set("only_completed", "1");
  if (filters.onlyTranslated) params.set("only_translated", "1");
  if (filters.hideOnBreak) params.set("hide_on_break", "1");
  if (filters.minChapters != null) params.set("min_chapters", String(filters.minChapters));
  if (filters.maxChapters != null) params.set("max_chapters", String(filters.maxChapters));
  if (filters.minRating != null) params.set("min_rating", String(filters.minRating));

  return queryOptions({
    queryKey: queryKeys.browse(feed, page, filters),
    queryFn: () => apiGet<Manga[]>(`/api/browse?${params.toString()}`),
    staleTime: STALE_MS.manga,
  });
}

export function mangaQueryOptions(provider: MangaProviderType, id: string) {
  return queryOptions({
    queryKey: queryKeys.manga(provider, id),
    queryFn: () =>
      apiGet<Manga>(`/api/manga/${encodeURIComponent(provider)}/${encodeURIComponent(id)}`),
    staleTime: STALE_MS.manga,
  });
}

const CHAPTER_PAGE_SIZE = 50;

export function chaptersPageQueryOptions(
  provider: MangaProviderType,
  id: string,
  page: number,
) {
  return queryOptions({
    queryKey: [...queryKeys.chapters(provider, id), "page", page],
    queryFn: () =>
      apiGet<ChapterListResult>(
        `/api/manga/${encodeURIComponent(provider)}/${encodeURIComponent(id)}/chapters?page=${page}&limit=${CHAPTER_PAGE_SIZE}`,
      ),
    staleTime: STALE_MS.chapters,
    retry: false,
  });
}

export function chaptersInfiniteQueryOptions(
  provider: MangaProviderType,
  id: string,
) {
  return infiniteQueryOptions({
    queryKey: [...queryKeys.chapters(provider, id), "infinite"],
    queryFn: ({ pageParam }) =>
      apiGet<ChapterListResult>(
        `/api/manga/${encodeURIComponent(provider)}/${encodeURIComponent(id)}/chapters?page=${pageParam}&limit=${CHAPTER_PAGE_SIZE}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
    staleTime: STALE_MS.chapters,
    retry: false,
  });
}

export function chaptersQueryOptions(provider: MangaProviderType, id: string) {
  return queryOptions({
    queryKey: [...queryKeys.chapters(provider, id), "all"],
    queryFn: async () => {
      const result = await apiGet<ChapterListResult>(
        `/api/manga/${encodeURIComponent(provider)}/${encodeURIComponent(id)}/chapters`,
      );
      return result.chapters;
    },
    staleTime: STALE_MS.chapters,
    retry: false,
  });
}

export function pagesQueryOptions(provider: MangaProviderType, chapterId: string) {
  return queryOptions({
    queryKey: queryKeys.pages(provider, chapterId),
    queryFn: () =>
      apiGet<Page[]>(
        `/api/chapter/${encodeURIComponent(provider)}/${encodeURIComponent(chapterId)}/pages`,
      ),
    staleTime: STALE_MS.pages,
  });
}

export function favoritesQueryOptions(enabled: boolean, page = 1) {
  return queryOptions({
    queryKey: queryKeys.favorites(page),
    queryFn: () => listFavorites({ page }),
    staleTime: 60_000,
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function continueReadingQueryOptions(enabled: boolean) {
  return queryOptions({
    queryKey: queryKeys.continueReading(),
    queryFn: listContinueReading,
    staleTime: 60_000,
    enabled,
  });
}

export function recentChaptersQueryOptions(enabled: boolean) {
  return queryOptions({
    queryKey: queryKeys.recentChapters(),
    queryFn: listRecentChapters,
    staleTime: 60_000,
    enabled,
  });
}

export function recentViewsQueryOptions(enabled: boolean) {
  return queryOptions({
    queryKey: queryKeys.recentViews(),
    queryFn: listRecentMangaViews,
    staleTime: 60_000,
    enabled,
  });
}

export function favoriteStatusQueryOptions(
  provider: MangaProviderType,
  id: string,
  enabled: boolean,
) {
  return queryOptions({
    queryKey: queryKeys.favoriteStatus(provider, id),
    queryFn: () => isFavorite(provider, id),
    staleTime: 60_000,
    enabled,
  });
}

export function readingProgressQueryOptions(
  provider: MangaProviderType,
  chapterId: string,
  enabled: boolean,
) {
  return queryOptions({
    queryKey: queryKeys.readingProgress(provider, chapterId),
    queryFn: () => getReadingProgress(provider, chapterId),
    staleTime: 30_000,
    enabled,
  });
}

export function mangaChapterProgressQueryOptions(
  provider: MangaProviderType,
  mangaId: string,
  enabled: boolean,
) {
  return queryOptions({
    queryKey: queryKeys.mangaChapterProgress(provider, mangaId),
    queryFn: () => listMangaChapterProgress(provider, mangaId),
    staleTime: 30_000,
    enabled,
  });
}
