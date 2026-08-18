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
  const match = slug.match(/chapter-([\d]+(?:[-.]\d+)?)-eng-li\/?$/i);
  if (!match) return null;
  return match[1].replace("-", ".");
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
