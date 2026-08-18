import { AniListProvider } from "./anilist";
import { MgekoProvider } from "./mgeko";
import { ProviderError } from "./errors";
import type { MangaProvider } from "./types";
import type { MangaProviderType } from "@/types/manga";

const providers: Record<MangaProviderType, MangaProvider> = {
  mgeko: new MgekoProvider(),
  anilist: new AniListProvider(),
};

export function getProvider(type: MangaProviderType): MangaProvider {
  const provider = providers[type];
  if (!provider) {
    throw new ProviderError("INVALID_PROVIDER", "Invalid manga provider.", 400);
  }
  return provider;
}

export function isMangaProviderType(value: string): value is MangaProviderType {
  return value === "mgeko" || value === "anilist";
}

export function getSearchProviders(): MangaProvider[] {
  return [providers.mgeko];
}
