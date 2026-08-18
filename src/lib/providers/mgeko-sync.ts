import * as cheerio from "cheerio";
import { MgekoAuthError, mgekoAuthFetchHtml } from "./mgeko-auth-fetch";
import {
  chapterNumberFromSlug,
  decodeHtmlEntities,
  resolveCoverUrl,
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

function isReadChapterLi($el: cheerio.Cheerio<any>): boolean {
  const cls = ($el.attr("class") ?? "").toLowerCase();
  if (/\b(visited|read|viewed|chapter-read|read-chapter|is-read)\b/.test(cls)) {
    return true;
  }

  if (
    $el.find(
      ".visited, .read, .viewed, .chapter-read, .read-chapter, [class*='read']",
    ).length > 0
  ) {
    return true;
  }

  if ($el.find('[aria-label*="read" i], [title*="read" i]').length > 0) {
    return true;
  }

  const iconText = $el
    .find("i, span.material-icons, .material-icons, svg")
    .text()
    .toLowerCase();
  if (iconText.includes("check") || iconText.includes("done")) {
    return true;
  }

  if ($el.find(".chapter-read-icon, .read-icon, .visited-icon").length > 0) {
    return true;
  }

  return false;
}

export function parseMgekoReadChapters(html: string): MgekoReadChapter[] {
  const $ = cheerio.load(html);
  const read: MgekoReadChapter[] = [];
  const seen = new Set<string>();

  $("ul.chapter-list li").each((_, el) => {
    const $el = $(el);
    if (!isReadChapterLi($el)) return;

    const href = $el.find("a").first().attr("href") ?? "";
    const chapterMatch = href.match(/\/reader\/en\/([^/]+)\/?/);
    if (!chapterMatch) return;

    const chapterId = chapterMatch[1];
    if (seen.has(chapterId)) return;
    seen.add(chapterId);

    read.push({
      chapterId,
      chapterNumber: chapterNumberFromSlug(chapterId),
    });
  });

  return read;
}

export async function fetchMgekoBookmarks(sessionId: string): Promise<MgekoBookmark[]> {
  const html = await mgekoAuthFetchHtml("/portal/bookmark/", sessionId);
  return parseMgekoBookmarks(html);
}

export async function fetchMgekoReadChapters(
  sessionId: string,
  mangaId: string,
): Promise<MgekoReadChapter[]> {
  const html = await mgekoAuthFetchHtml(
    `/manga/${encodeURIComponent(mangaId)}/all-chapters/`,
    sessionId,
  );
  return parseMgekoReadChapters(html);
}
