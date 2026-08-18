const MGEKO_COVER_CDN = "https://imgsrv5.com/avatar/288x412";

export function resolveCoverUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.includes("/avatar/")) return raw;
  if (raw.startsWith("http")) {
    return raw.replace("https://imgsrv5.com/", `${MGEKO_COVER_CDN}/`);
  }
  return `${MGEKO_COVER_CDN}${raw}`;
}

export function chapterNumberFromSlug(slug: string): string | null {
  const fullMatch = slug.match(/chapter-([\d]+(?:[-.]\d+)?)-eng-li\/?$/i);
  if (fullMatch) return fullMatch[1].replace("-", ".");

  const shortMatch = slug.match(/^([\d]+(?:-\d+)?)-eng-li\/?$/i);
  if (shortMatch) return shortMatch[1].replace("-", ".");

  return null;
}

/** Normalize short mgeko chapter ids from all-chapters page to reader slugs. */
export function resolveMgekoChapterId(mangaId: string, rawId: string): string {
  const trimmed = rawId.trim().replace(/\/$/, "");
  if (!trimmed) return trimmed;
  if (trimmed.includes("-chapter-")) return trimmed;
  if (/^[\d]+(?:-\d+)?-eng-li$/i.test(trimmed)) {
    return `${mangaId}-chapter-${trimmed}`;
  }
  return trimmed;
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}
