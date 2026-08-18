import {
  apiSuccess,
  handleRouteError,
} from "@/lib/api/response";
import { browseManga, parseBrowsePage } from "@/lib/data/browse";
import type { BrowseFeed, BrowseOptions, BrowseStatusFilter, BrowseTypeFilter, BrowseSortOption } from "@/lib/providers/types";
import { ProviderError } from "@/lib/providers/errors";

const FEEDS: BrowseFeed[] = ["recently-added", "latest-updates", "popular"];

function parseBrowseFeed(raw: string | null): BrowseFeed {
  if (raw && FEEDS.includes(raw as BrowseFeed)) {
    return raw as BrowseFeed;
  }
  throw new ProviderError("VALIDATION_ERROR", "Invalid browse feed.", 400);
}

function parseFilters(searchParams: URLSearchParams): BrowseOptions {
  const opts: BrowseOptions = {};

  const q = searchParams.get("q");
  if (q) opts.q = q;

  const status = searchParams.get("status");
  const STATUSES: BrowseStatusFilter[] = ["ongoing", "completed", "hiatus"];
  if (status && STATUSES.includes(status as BrowseStatusFilter)) {
    opts.status = status as BrowseStatusFilter;
  }

  const type = searchParams.get("type");
  const TYPES: BrowseTypeFilter[] = ["manga", "manhwa", "manhua", "webtoon"];
  if (type && TYPES.includes(type as BrowseTypeFilter)) {
    opts.type = type as BrowseTypeFilter;
  }

  const sort = searchParams.get("sort");
  const SORTS: BrowseSortOption[] = [
    "recently_added", "latest", "popular_daily", "popular_weekly",
    "popular_monthly", "popular_all_time", "top_rated", "title_az", "title_za",
  ];
  if (sort && SORTS.includes(sort as BrowseSortOption)) {
    opts.sort = sort as BrowseSortOption;
  }

  // safe_mode=1 means hide NSFW; safe_mode=0 means show NSFW
  const safeMode = searchParams.get("safe_mode");
  if (safeMode !== null) opts.safeMode = safeMode === "1";

  const includeGenres = searchParams.get("include_genres");
  if (includeGenres) opts.includeGenres = includeGenres.split(",").filter(Boolean);

  const excludeGenres = searchParams.get("exclude_genres");
  if (excludeGenres) opts.excludeGenres = excludeGenres.split(",").filter(Boolean);

  if (searchParams.get("only_completed") === "1") opts.onlyCompleted = true;
  if (searchParams.get("only_translated") === "1") opts.onlyTranslated = true;
  if (searchParams.get("hide_on_break") === "1") opts.hideOnBreak = true;

  const minCh = searchParams.get("min_chapters");
  if (minCh) opts.minChapters = Number(minCh);
  const maxCh = searchParams.get("max_chapters");
  if (maxCh) opts.maxChapters = Number(maxCh);
  const minRating = searchParams.get("min_rating");
  if (minRating) opts.minRating = Number(minRating);

  return opts;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const feed = parseBrowseFeed(searchParams.get("feed"));
    const page = parseBrowsePage(searchParams.get("page") ?? undefined);
    const filters = parseFilters(searchParams);
    const data = await browseManga(feed, { ...filters, page });
    return apiSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
