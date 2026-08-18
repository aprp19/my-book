import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  BrowseFilters,
  BrowseSortOption,
} from "@/lib/providers/types";

export type { BrowseFilters, BrowseSortOption };

export const DEFAULT_BROWSE_FILTERS: BrowseFilters = { safeMode: false };

export const BROWSE_SORT_OPTIONS: { value: BrowseSortOption; label: string }[] = [
  { value: "recently_added", label: "Recently Added" },
  { value: "latest", label: "Latest Update" },
  { value: "popular_daily", label: "Popular Today" },
  { value: "popular_weekly", label: "Popular This Week" },
  { value: "popular_monthly", label: "Popular This Month" },
  { value: "popular_all_time", label: "All Time Popular" },
  { value: "top_rated", label: "Top Rated" },
  { value: "title_az", label: "Title A–Z" },
  { value: "title_za", label: "Title Z–A" },
];

export const BROWSE_STATUS_OPTIONS = [
  { value: "ongoing" as const, label: "Ongoing" },
  { value: "completed" as const, label: "Completed" },
  { value: "hiatus" as const, label: "Hiatus" },
];

export const BROWSE_TYPE_OPTIONS = [
  { value: "manga" as const, label: "Manga" },
  { value: "manhwa" as const, label: "Manhwa" },
  { value: "manhua" as const, label: "Manhua" },
  { value: "webtoon" as const, label: "Webtoon" },
];

export const BROWSE_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Historical",
  "Horror", "Isekai", "Martial Arts", "Mystery", "Psychological", "Romance",
  "School Life", "Sci Fi", "Seinen", "Shoujo", "Shounen", "Slice Of Life",
  "Sports", "Supernatural", "Tragedy", "Webtoons",
];

export function buildBrowseParams(filters: BrowseFilters, page = 1): URLSearchParams {
  const params = new URLSearchParams();

  if (page > 1) params.set("page", String(page));
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

  return params;
}

export function parseBrowseFilters(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
): BrowseFilters {
  const filters: BrowseFilters = {
    safeMode: searchParams.get("safe_mode") === "1",
  };

  const q = searchParams.get("q");
  if (q) filters.q = q;
  const status = searchParams.get("status");
  if (status === "ongoing" || status === "completed" || status === "hiatus") {
    filters.status = status;
  }
  const type = searchParams.get("type");
  if (type === "manga" || type === "manhwa" || type === "manhua" || type === "webtoon") {
    filters.type = type;
  }
  const sort = searchParams.get("sort");
  if (sort) filters.sort = sort as BrowseSortOption;

  const includeGenres = searchParams.get("include_genres");
  if (includeGenres) filters.includeGenres = includeGenres.split(",").filter(Boolean);
  const excludeGenres = searchParams.get("exclude_genres");
  if (excludeGenres) filters.excludeGenres = excludeGenres.split(",").filter(Boolean);

  if (searchParams.get("only_completed") === "1") filters.onlyCompleted = true;
  if (searchParams.get("only_translated") === "1") filters.onlyTranslated = true;
  if (searchParams.get("hide_on_break") === "1") filters.hideOnBreak = true;

  const minChapters = searchParams.get("min_chapters");
  if (minChapters) filters.minChapters = Number(minChapters);
  const maxChapters = searchParams.get("max_chapters");
  if (maxChapters) filters.maxChapters = Number(maxChapters);
  const minRating = searchParams.get("min_rating");
  if (minRating) filters.minRating = Number(minRating);

  return filters;
}

export function browseHref(filters: BrowseFilters) {
  const query = buildBrowseParams(filters).toString();
  return query ? `/browse?${query}` : "/browse";
}

export function countActiveBrowseFilters(filters: BrowseFilters) {
  return Object.entries(filters).filter(
    ([k, v]) =>
      k !== "safeMode" &&
      k !== "q" &&
      k !== "sort" &&
      v !== undefined &&
      (!Array.isArray(v) || v.length > 0),
  ).length;
}

export function setBrowseFilterValue<K extends keyof BrowseFilters>(
  prev: BrowseFilters,
  key: K,
  value: BrowseFilters[K] | undefined,
): BrowseFilters {
  const next = { ...prev };
  if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
    delete next[key];
  } else {
    next[key] = value;
  }
  return next;
}
