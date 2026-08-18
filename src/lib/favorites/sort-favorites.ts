import { getProvider, isMangaProviderType } from "@/lib/providers/registry";
import type { MangaProviderType } from "@/types/manga";

export interface FavoriteRow {
  id: string;
  user_id: string;
  provider: string;
  external_manga_id: string;
  title: string;
  cover_url: string | null;
  created_at: string;
}

export interface LatestChapterInfo {
  id: string;
  publishedAt: string | null;
}

export interface FavoriteWithChapterUpdate extends FavoriteRow {
  lastChapterUpdatedAt: string | null;
  latestChapterId: string | null;
  hasNewChapter: boolean;
}

const FAVORITE_UPDATE_CONCURRENCY = 6;

export function sortFavoritesByChapterUpdate<T extends FavoriteWithChapterUpdate>(
  favorites: T[],
): T[] {
  return [...favorites].sort((a, b) => {
    const aTime = a.lastChapterUpdatedAt
      ? Date.parse(a.lastChapterUpdatedAt)
      : Number.NEGATIVE_INFINITY;
    const bTime = b.lastChapterUpdatedAt
      ? Date.parse(b.lastChapterUpdatedAt)
      : Number.NEGATIVE_INFINITY;

    if (bTime !== aTime) return bTime - aTime;
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
}

export async function fetchLatestChapter(
  provider: string,
  mangaId: string,
): Promise<LatestChapterInfo | null> {
  if (!isMangaProviderType(provider)) return null;

  try {
    const result = await getProvider(provider as MangaProviderType).getChapters(mangaId, {
      page: 1,
      limit: 1,
    });
    const latest = result.chapters[0];
    if (!latest) return null;
    return { id: latest.id, publishedAt: latest.publishedAt ?? null };
  } catch {
    return null;
  }
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
) {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      await fn(items[current]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
}

export async function enrichFavoritesWithChapterUpdates(
  favorites: FavoriteRow[],
  options: { sort?: boolean } = {},
): Promise<FavoriteWithChapterUpdate[]> {
  const sort = options.sort ?? true;
  const enriched: FavoriteWithChapterUpdate[] = favorites.map((row) => ({
    ...row,
    lastChapterUpdatedAt: null,
    latestChapterId: null,
    hasNewChapter: false,
  }));

  await mapPool(enriched, FAVORITE_UPDATE_CONCURRENCY, async (row) => {
    const latest = await fetchLatestChapter(row.provider, row.external_manga_id);
    row.latestChapterId = latest?.id ?? null;
    row.lastChapterUpdatedAt = latest?.publishedAt ?? null;
  });

  return sort ? sortFavoritesByChapterUpdate(enriched) : enriched;
}
