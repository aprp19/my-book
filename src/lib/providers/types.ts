import type { Chapter, ChapterListResult, Page } from "@/types/chapter";
import type { Manga, MangaProviderType } from "@/types/manga";

export type BrowseFeed = "recently-added" | "latest-updates" | "popular";

export type BrowseSortOption =
  | "recently_added"
  | "latest"
  | "popular_daily"
  | "popular_weekly"
  | "popular_monthly"
  | "popular_all_time"
  | "top_rated"
  | "title_az"
  | "title_za";

export type BrowseStatusFilter = "ongoing" | "completed" | "hiatus";
export type BrowseTypeFilter = "manga" | "manhwa" | "manhua" | "webtoon";

export interface BrowseFilters {
  /** Search query within browse results */
  q?: string;
  /** Publication status filter */
  status?: BrowseStatusFilter;
  /** Comic type filter */
  type?: BrowseTypeFilter;
  /** Sort order — overrides the feed default when set */
  sort?: BrowseSortOption;
  /** Include adult/NSFW content. Default false (safe mode on). */
  safeMode?: boolean;
  /** Genres to include (any match) */
  includeGenres?: string[];
  /** Genres to exclude */
  excludeGenres?: string[];
  /** Only completed series */
  onlyCompleted?: boolean;
  /** Only series with 50+ chapters */
  onlyTranslated?: boolean;
  /** Hide series on hiatus > 6 months */
  hideOnBreak?: boolean;
  /** Minimum chapter count */
  minChapters?: number;
  /** Maximum chapter count */
  maxChapters?: number;
  /** Minimum rating (1-5) */
  minRating?: number;
}

export interface BrowseOptions extends BrowseFilters {
  limit?: number;
  page?: number;
}

export interface ChapterListOptions {
  page?: number;
  limit?: number;
}

export interface MangaProvider {
  readonly type: MangaProviderType;
  search(query: string): Promise<Manga[]>;
  getManga(id: string): Promise<Manga>;
  getChapters(mangaId: string, options?: ChapterListOptions): Promise<ChapterListResult>;
  getPages(chapterId: string): Promise<Page[]>;
  browse?(feed: BrowseFeed, options?: BrowseOptions): Promise<Manga[]>;
}

export type { MangaProviderType };
