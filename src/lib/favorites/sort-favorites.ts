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

export interface FavoriteWithChapterUpdate extends FavoriteRow {
  lastChapterUpdatedAt: string | null;
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

export async function fetchLatestChapterUpdatedAt(
  provider: string,
  mangaId: string,
): Promise<string | null> {
  if (!isMangaProviderType(provider)) return null;

  try {
    const result = await getProvider(provider as MangaProviderType).getChapters(mangaId, {
      page: 1,
      limit: 1,
    });
    return result.chapters[0]?.publishedAt ?? null;
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
): Promise<FavoriteWithChapterUpdate[]> {
  const enriched: FavoriteWithChapterUpdate[] = favorites.map((row) => ({
    ...row,
    lastChapterUpdatedAt: null,
  }));

  await mapPool(enriched, FAVORITE_UPDATE_CONCURRENCY, async (row) => {
    row.lastChapterUpdatedAt = await fetchLatestChapterUpdatedAt(
      row.provider,
      row.external_manga_id,
    );
  });

  return sortFavoritesByChapterUpdate(enriched);
}
