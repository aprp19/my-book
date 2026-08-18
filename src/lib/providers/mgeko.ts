import * as cheerio from "cheerio";
import type { Chapter, ChapterListResult, Page } from "@/types/chapter";
import type { Manga, MangaStatus } from "@/types/manga";
import { CACHE_TTL } from "@/lib/cache/fetch";
import { ProviderError } from "./errors";
import { mgekoJsonFetch, mgekoPageFetch, MGEKO_BASE_URL } from "./mgeko-fetch";
import type { BrowseFeed, BrowseOptions, BrowseSortOption, MangaProvider } from "./types";

// ─── Response shapes ───────────────────────────────────────────────────────────

interface MgekoMostViewedEntry {
  name: string;
  slug: string;
  cover_url: string;
  latest_chapter?: string;
  last_updated?: string;
  rating?: number;
}

interface MgekoMostViewedResponse {
  manga: MgekoMostViewedEntry[];
}

interface MgekoBrowseDataResponse {
  results_html: string;
  pagination_html: string;
  total_results: number;
  page: number;
  num_pages: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const MGEKO_COVER_CDN = "https://imgsrv5.com/avatar/288x412";

/**
 * mgeko cover URLs come in three forms:
 *   1. Relative path: /media/manga_covers/... (from API JSON)
 *   2. Absolute without avatar: https://imgsrv5.com/media/manga_covers/...
 *   3. Already correct: https://imgsrv5.com/avatar/288x412/media/manga_covers/...
 *
 * Always normalise to form 3 — the resized avatar path — which reliably returns images.
 */
function resolveCoverUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.includes("/avatar/")) return raw;
  if (raw.startsWith("http")) {
    // Absolute but missing /avatar/288x412 prefix
    return raw.replace("https://imgsrv5.com/", `${MGEKO_COVER_CDN}/`);
  }
  // Relative path
  return `${MGEKO_COVER_CDN}${raw}`;
}

function mapStatus(text: string | undefined): MangaStatus | null {
  const lower = (text ?? "").toLowerCase().trim();
  if (lower === "ongoing") return "ongoing";
  if (lower === "completed") return "completed";
  if (lower === "hiatus") return "hiatus";
  if (lower === "cancelled" || lower === "canceled") return "cancelled";
  return "unknown";
}

/**
 * Extract chapter number from a mgeko chapter slug.
 * "m-being-misunderstood-as-a-soccer-genius-chapter-6-eng-li" → "6"
 * "apex-future-martial-arts2-chapter-260-eng-li" → "260"
 * Also handles decimal chapters like "314-5-eng-li" (i.e. 314.5)
 */
function chapterNumberFromSlug(slug: string): string | null {
  const match = slug.match(/chapter-([\d]+(?:[-.]\d+)?)-eng-li\/?$/i);
  if (!match) return null;
  // Normalise "314-5" → "314.5"
  return match[1].replace("-", ".");
}

/**
 * Extract the manga slug from a chapter slug by stripping the chapter part.
 * "m-being-misunderstood-as-a-soccer-genius-chapter-6-eng-li" → "m-being-misunderstood-as-a-soccer-genius"
 */
function mangaSlugFromChapterSlug(chapterSlug: string): string {
  return chapterSlug.replace(/-chapter-[\d].*$/i, "");
}

function normalizeMgekoManga(slug: string, name: string, coverUrl: string | null): Manga {
  return {
    id: slug,
    provider: "mgeko",
    title: decodeHtmlEntities(name),
    altTitles: [],
    description: null,
    coverUrl,
    author: null,
    artist: null,
    status: null,
    genres: [],
  };
}

/** Simple HTML entity decoder for common cases. */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class MgekoProvider implements MangaProvider {
  readonly type = "mgeko" as const;

  // ── search ────────────────────────────────────────────────────────────────

  async search(query: string): Promise<Manga[]> {
    const html = await mgekoPageFetch(
      `/autocomplete?term=${encodeURIComponent(query)}`,
      CACHE_TTL.search,
    );
    const $ = cheerio.load(html);
    const results: Manga[] = [];

    $("li.novel-item").each((_, el) => {
      const a = $(el).find("a").first();
      const href = a.attr("href") ?? "";
      const slugMatch = href.match(/\/manga\/([^/]+)\/?/);
      if (!slugMatch) return;
      const slug = slugMatch[1];
      const title = a.attr("title") ?? $(el).find("h4").text().trim();
      const cover =
        $(el).find("img").attr("src") ??
        $(el).find("img").attr("data-src") ??
        null;
      results.push(normalizeMgekoManga(slug, title, cover));
    });

    return results;
  }

  // ── getManga ──────────────────────────────────────────────────────────────

  async getManga(id: string): Promise<Manga> {
    let html: string;
    try {
      html = await mgekoPageFetch(`/manga/${encodeURIComponent(id)}/`, CACHE_TTL.manga);
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError("MANGA_NOT_FOUND", "Manga not found.", 404);
    }

    const $ = cheerio.load(html);

    const title = decodeHtmlEntities($("h1").first().text().trim());
    if (!title) {
      throw new ProviderError("MANGA_NOT_FOUND", "Manga not found.", 404);
    }

    // Cover: prefer data-src (lazy-loaded) over src
    const coverEl = $(".cover img").first();
    const coverUrl =
      coverEl.attr("data-src") ?? coverEl.attr("src") ?? null;

    // Description: meta description or summary div
    const descMeta = $("meta[name='description']").attr("content");
    // The meta description includes boilerplate — use it as fallback
    const summaryEl = $(".summary, .synopsis, .novel-synopsis, .description").first();
    const description = summaryEl.text().trim() || descMeta || null;

    // Status
    const statusText = $(".ongoing, .completed, .hiatus, .cancelled").first().text().trim();
    const status = mapStatus(statusText);

    // Genres
    const genres: string[] = [];
    $(".categories .property-item, .categories a").each((_, el) => {
      const genre = $(el).text().trim();
      if (genre) genres.push(genre);
    });

    // Author – not reliably exposed on manga pages; skip for now
    return {
      id,
      provider: "mgeko",
      title,
      altTitles: [],
      description,
      coverUrl: resolveCoverUrl(coverUrl ?? undefined),
      author: null,
      artist: null,
      status,
      genres,
    };
  }

  // ── getChapters ────────────────────────────────────────────────────────────

  async getChapters(
    mangaId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<ChapterListResult> {
    // /all-chapters/ returns the complete chapter list in one request
    const html = await mgekoPageFetch(
      `/manga/${encodeURIComponent(mangaId)}/all-chapters/`,
      CACHE_TTL.chapters,
    );
    const $ = cheerio.load(html);

    const allChapters: Chapter[] = [];

    $("ul.chapter-list li").each((_, el) => {
      const href = $(el).find("a").attr("href") ?? "";
      const chapterSlugMatch = href.match(/\/reader\/en\/([^/]+)\/?/);
      if (!chapterSlugMatch) return;

      const chapterSlug = chapterSlugMatch[1];
      const number = chapterNumberFromSlug(chapterSlug);

      // <time datetime="Aug. 18, 2026, 3:22 a.m."> or .chapter-update text
      const publishedAt =
        $(el).find("time").attr("datetime") ??
        ($(el).find(".chapter-update").text().trim() || null);

      allChapters.push({
        id: chapterSlug,
        mangaId,
        provider: "mgeko",
        number,
        title: null,
        volume: null,
        language: "en",
        publishedAt,
      });
    });

    // /all-chapters/ comes newest-first; keep that order.
    // Apply pagination if requested
    const { page, limit } = options;
    if (page !== undefined && limit !== undefined) {
      const offset = (page - 1) * limit;
      const slice = allChapters.slice(offset, offset + limit);
      return { chapters: slice, hasMore: offset + limit < allChapters.length };
    }

    return { chapters: allChapters, hasMore: false };
  }

  // ── getPages ───────────────────────────────────────────────────────────────

  async getPages(chapterId: string): Promise<Page[]> {
    // chapterId is the full mgeko chapter slug, e.g.:
    //   "m-being-misunderstood-as-a-soccer-genius-chapter-6-eng-li"
    let html: string;
    try {
      html = await mgekoPageFetch(
        `/reader/en/${encodeURIComponent(chapterId)}/`,
        CACHE_TTL.pages,
      );
    } catch (err) {
      if (err instanceof ProviderError && err.status === 404) {
        throw new ProviderError("PAGES_NOT_FOUND", "Chapter pages not found.", 404);
      }
      throw err;
    }

    const $ = cheerio.load(html);

    // Images are server-rendered as <img src="https://imgsrv5.com/...">
    const pages: Page[] = [];
    $("img[src]").each((_, el) => {
      const src = $(el).attr("src") ?? "";
      if (src.includes("imgsrv") || src.includes("mgekocdn")) {
        // Skip loading spinner / placeholder svgs
        if (src.endsWith(".svg")) return;
        pages.push({ index: pages.length, imageUrl: src });
      }
    });

    if (pages.length === 0) {
      throw new ProviderError("PAGES_NOT_FOUND", "Chapter pages not found.", 404);
    }

    return pages;
  }

  // ── browse ─────────────────────────────────────────────────────────────────

  async browse(feed: BrowseFeed, options: BrowseOptions = {}): Promise<Manga[]> {
    const page = options.page ?? 1;

    // Map feed → default sort when no explicit sort is given
    const defaultSort: Record<BrowseFeed, BrowseSortOption> = {
      "recently-added": "recently_added",
      "latest-updates": "latest",
      popular: "popular_monthly",
    };

    const sort = options.sort ?? defaultSort[feed];

    // Build query params for /browse-comics/data/
    const params = new URLSearchParams();
    params.set("sort", sort);
    params.set("page", String(page));
    // safe_mode=0 means NSFW shown; safe_mode=1 hides it. Default: hide NSFW.
    params.set("safe_mode", options.safeMode === true ? "1" : "0");

    if (options.q) params.set("q", options.q);
    if (options.status) params.set("status", options.status);
    if (options.type) params.set("type", options.type);
    if (options.onlyCompleted) params.set("only_completed", "1");
    if (options.onlyTranslated) params.set("only_translated", "1");
    if (options.hideOnBreak) params.set("hide_on_break", "1");
    if (options.minChapters != null) params.set("min_chapters", String(options.minChapters));
    if (options.maxChapters != null) params.set("max_chapters", String(options.maxChapters));
    if (options.minRating != null) params.set("min_rating", String(options.minRating));
    if (options.includeGenres?.length) {
      params.set("include_genres", options.includeGenres.join(","));
    }
    if (options.excludeGenres?.length) {
      params.set("exclude_genres", options.excludeGenres.join(","));
    }

    const data = await mgekoJsonFetch<MgekoBrowseDataResponse>(
      `/browse-comics/data/?${params.toString()}`,
      CACHE_TTL.search,
    );

    // results_html contains comic-card articles — parse them with cheerio
    const $ = cheerio.load(data.results_html ?? "");
    const results: Manga[] = [];

    $("article").each((_, el) => {
      const $el = $(el);
      const href = $el.find("a").first().attr("href") ?? "";
      const slugMatch = href.match(/\/manga\/([^/]+)\/?/);
      if (!slugMatch) return;
      const slug = slugMatch[1];
      const title = $el.find(".comic-card__title a, h3 a, h2 a").first().text().trim()
        || $el.find("img").first().attr("alt")
        || slug;
      const cover =
        $el.find("img").first().attr("src") ??
        $el.find("img").first().attr("data-src") ??
        null;
      results.push(normalizeMgekoManga(slug, title, resolveCoverUrl(cover ?? undefined)));
    });

    return results;
  }
}

export { mangaSlugFromChapterSlug };
