export const CACHE_TTL = {
  search: 300,
  manga: 900,
  chapters: 900,
  pages: 300,
} as const;

export function cachedFetch(
  url: string,
  revalidate: number,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, {
    ...init,
    next: { revalidate },
  });
}
