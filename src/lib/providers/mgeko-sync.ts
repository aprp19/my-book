import * as cheerio from "cheerio";
import { MgekoAuthError, mgekoAuthFetchHtml } from "./mgeko-auth-fetch";
import {
  chapterNumberFromSlug,
  decodeHtmlEntities,
  resolveCoverUrl,
  resolveMgekoChapterId,
} from "./mgeko-utils";

export interface MgekoBookmark {
  mangaId: string;
  title: string;
  coverUrl: string | null;
}

export interface MgekoReadChapter {
  chapterId: string;
  chapterNumber: string | null;
}

function isMgekoLoginPage($: cheerio.CheerioAPI): boolean {
  const title = $("title").text().toLowerCase();
  const h1 = $("h1").first().text().toLowerCase();
  if (title.includes("login") || h1.includes("welcome back")) return true;
  if ($('a[href*="/portal/api/login/"]').length > 0 && $("a[href*='/manga/']").length === 0) {
    return true;
  }
  return false;
}

function addBookmark(
  map: Map<string, MgekoBookmark>,
  slug: string,
  title: string,
  coverUrl: string | null,
) {
  if (!slug || map.has(slug)) return;
  const trimmedTitle = decodeHtmlEntities(title.trim());
  map.set(slug, {
    mangaId: slug,
    title: trimmedTitle || slug,
    coverUrl,
  });
}

export function parseMgekoBookmarks(html: string): MgekoBookmark[] {
  const $ = cheerio.load(html);
  if (isMgekoLoginPage($)) {
    throw new MgekoAuthError(
      "INVALID_SESSION",
      "Session expired — log in on mgeko and copy a fresh sessionid.",
    );
  }

  const bySlug = new Map<string, MgekoBookmark>();

  $("article").each((_, el) => {
    const $el = $(el);
    const href = $el.find("a[href*='/manga/']").first().attr("href") ?? "";
    const slugMatch = href.match(/\/manga\/([^/]+)\/?/);
    if (!slugMatch) return;
    const slug = slugMatch[1];
    const title =
      $el.find(".comic-card__title a, h3 a, h2 a").first().text().trim() ||
      $el.find("img").first().attr("alt") ||
      slug;
    const cover =
      $el.find("img").first().attr("src") ??
      $el.find("img").first().attr("data-src") ??
      null;
    addBookmark(bySlug, slug, title, resolveCoverUrl(cover ?? undefined));
  });

  $(".bookmark-item, .bookmarked-item, [class*='bookmark']").each((_, el) => {
    const $el = $(el);
    const href = $el.find("a[href*='/manga/']").first().attr("href") ?? $el.attr("href") ?? "";
    const slugMatch = href.match(/\/manga\/([^/]+)\/?/);
    if (!slugMatch) return;
    const slug = slugMatch[1];
    const title =
      $el.find(".title, h3, h4, a").first().text().trim() ||
      $el.find("img").first().attr("alt") ||
      slug;
    const cover =
      $el.find("img").first().attr("src") ??
      $el.find("img").first().attr("data-src") ??
      null;
    addBookmark(bySlug, slug, title, resolveCoverUrl(cover ?? undefined));
  });

  $("a[href*='/manga/']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const slugMatch = href.match(/\/manga\/([^/]+)\/?$/);
    if (!slugMatch) return;
    const slug = slugMatch[1];
    const title = $(el).text().trim() || $(el).attr("title") || slug;
    const img =
      $(el).find("img").first().attr("src") ??
      $(el).find("img").first().attr("data-src") ??
      null;
    addBookmark(bySlug, slug, title, resolveCoverUrl(img ?? undefined));
  });

  if (bySlug.size === 0 && isMgekoLoginPage($)) {
    throw new MgekoAuthError(
      "INVALID_SESSION",
      "Session expired — log in on mgeko and copy a fresh sessionid.",
    );
  }

  return [...bySlug.values()];
}

function extractChapterIdFromLi(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<any>,
  mangaId: string,
): string | null {
  const href = $el.find("a[href*='/reader/en/']").first().attr("href") ?? "";
  const hrefMatch = href.match(/\/reader\/en\/([^/]+)\/?/);
  if (hrefMatch) return hrefMatch[1];

  const onclick =
    $el.find("[onclick*='changeViewStatus']").attr("onclick") ??
    $el.attr("onclick") ??
    "";
  const onclickMatch = onclick.match(
    /changeViewStatus\s*\(\s*event\s*,\s*['"]([^'"]+)['"]/i,
  );
  if (onclickMatch) {
    return resolveMgekoChapterId(mangaId, onclickMatch[1]);
  }

  const titleText =
    $el.find("strong.chapter-title").first().text().trim() ||
    $el.find("a strong").first().text().trim();
  if (titleText) {
    return resolveMgekoChapterId(mangaId, titleText);
  }

  return null;
}

function liEyeReadState($el: cheerio.Cheerio<any>): "read" | "unread" | "unknown" {
  const blob = `${$el.attr("class") ?? ""} ${$el.html() ?? ""}`;
  if (/\bfa-eye-slash\b/.test(blob)) return "unread";
  if (/\bfa-eye\b/.test(blob)) return "read";
  return "unknown";
}

function liHasViewToggle($el: cheerio.Cheerio<any>): boolean {
  if (($el.attr("onclick") ?? "").includes("changeViewStatus")) return true;
  return $el.find("[onclick*='changeViewStatus']").length > 0;
}

function isReadChapterLi($el: cheerio.Cheerio<any>): boolean {
  if (liHasViewToggle($el)) {
    const state = liEyeReadState($el);
    if (state === "read") return true;
    if (state === "unread") return false;
    return false;
  }

  const cls = ($el.attr("class") ?? "").toLowerCase();
  if (/\b(visited|read|viewed|chapter-read|read-chapter|is-read)\b/.test(cls)) {
    return true;
  }

  if (
    $el.find(".visited, .viewed, .chapter-read, .read-chapter, .visited-icon")
      .length > 0
  ) {
    return true;
  }

  if ($el.find(".chapter-read-icon, .read-icon").length > 0) {
    return true;
  }

  return false;
}

export interface MgekoReadChaptersParseResult {
  chapters: MgekoReadChapter[];
  chapterRowCount: number;
  hasViewMarkers: boolean;
}

function getChapterListItems($: cheerio.CheerioAPI): cheerio.Cheerio<any> {
  const primary = $("ul.chapter-list li");
  if (primary.length > 0) return primary;

  return $("li").filter((_, el) => {
    const $el = $(el);
    return (
      $el.find("a[href*='/reader/en/']").length > 0 ||
      $el.find("[onclick*='changeViewStatus']").length > 0 ||
      $el.find("strong.chapter-title").length > 0
    );
  });
}

export function parseMgekoReadChaptersPage(
  html: string,
  mangaId: string,
): MgekoReadChaptersParseResult {
  const $ = cheerio.load(html);
  const read: MgekoReadChapter[] = [];
  const seen = new Set<string>();
  const chapterItems = getChapterListItems($);

  chapterItems.each((_, el) => {
    const $el = $(el);
    if (!isReadChapterLi($el)) return;

    const chapterId = extractChapterIdFromLi($, $el, mangaId);
    if (!chapterId || seen.has(chapterId)) return;
    seen.add(chapterId);

    read.push({
      chapterId,
      chapterNumber: chapterNumberFromSlug(chapterId),
    });
  });

  const chapterRowCount = chapterItems.length;
  const hasViewMarkers =
    html.includes("changeViewStatus") || /\bfa-eye(?:-slash)?\b/.test(html);

  return { chapters: read, chapterRowCount, hasViewMarkers };
}

export function parseMgekoReadChapters(
  html: string,
  mangaId: string,
): MgekoReadChapter[] {
  return parseMgekoReadChaptersPage(html, mangaId).chapters;
}

export async function fetchMgekoBookmarks(sessionId: string): Promise<MgekoBookmark[]> {
  const html = await mgekoAuthFetchHtml("/portal/bookmark/", sessionId);
  return parseMgekoBookmarks(html);
}

export async function fetchMgekoReadChapters(
  sessionId: string,
  mangaId: string,
): Promise<MgekoReadChaptersParseResult> {
  const html = await mgekoAuthFetchHtml(
    `/manga/${encodeURIComponent(mangaId)}/all-chapters/`,
    sessionId,
  );
  return parseMgekoReadChaptersPage(html, mangaId);
}
