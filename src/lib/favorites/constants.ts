/** Favorites grid page size (2–5 columns × comfortable row count). */
export const FAVORITES_PAGE_SIZE = 24;

export function parseFavoritesPage(value: string | null | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export function favoritesPageCount(total: number, pageSize = FAVORITES_PAGE_SIZE): number {
  if (total <= 0) return 1;
  return Math.ceil(total / pageSize);
}
