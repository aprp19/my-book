import { getProvider } from "@/lib/providers/registry";
import type { MangaProviderType } from "@/types";

export async function fetchManga(provider: MangaProviderType, id: string) {
  return getProvider(provider).getManga(id);
}

export async function fetchChapters(provider: MangaProviderType, id: string) {
  const result = await getProvider(provider).getChapters(id);
  return result.chapters;
}

export async function fetchPages(provider: MangaProviderType, chapterId: string) {
  return getProvider(provider).getPages(chapterId);
}

export async function searchManga(query: string) {
  return getProvider("mgeko").search(query);
}
