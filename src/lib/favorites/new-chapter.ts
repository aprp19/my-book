export function computeHasNewChapter(
  latestChapterId: string | null,
  readChapterIds: Set<string>,
  hasAnyProgress: boolean,
): boolean {
  if (!latestChapterId || !hasAnyProgress) return false;
  return !readChapterIds.has(latestChapterId);
}

export function favoriteProgressKey(provider: string, mangaId: string): string {
  return `${provider}:${mangaId}`;
}
