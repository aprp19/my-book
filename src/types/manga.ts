export type MangaProviderType = "mgeko" | "anilist";

export type MangaStatus =
  | "ongoing"
  | "completed"
  | "hiatus"
  | "cancelled"
  | "unknown";

export interface Manga {
  id: string;
  provider: MangaProviderType;
  title: string;
  altTitles: string[];
  description: string | null;
  coverUrl: string | null;
  author: string | null;
  artist: string | null;
  status: MangaStatus | null;
  genres: string[];
}

export interface MangaSearchResult {
  id: string;
  provider: MangaProviderType;
  title: string;
  coverUrl: string | null;
}
