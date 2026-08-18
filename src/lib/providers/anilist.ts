import type { Chapter, ChapterListResult, Page } from "@/types/chapter";
import type { Manga, MangaStatus } from "@/types/manga";
import { CACHE_TTL, cachedFetch } from "@/lib/cache/fetch";
import { ProviderError } from "./errors";
import type { MangaProvider } from "./types";

const GRAPHQL_URL = "https://graphql.anilist.co";

interface AniListMedia {
  id: number;
  title: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
  };
  description?: string | null;
  coverImage?: { large?: string | null };
  status?: string | null;
  genres?: string[] | null;
  staff?: {
    edges?: { role?: string | null; node?: { name?: { full?: string | null } } }[];
  };
}

function mapAniListStatus(status: string | null | undefined): MangaStatus | null {
  switch (status) {
    case "RELEASING":
      return "ongoing";
    case "FINISHED":
      return "completed";
    case "HIATUS":
      return "hiatus";
    case "CANCELLED":
      return "cancelled";
    default:
      return "unknown";
  }
}

function normalizeAniListMedia(media: AniListMedia): Manga {
  const title =
    media.title.english ?? media.title.romaji ?? media.title.native ?? "Untitled";
  const altTitles = [media.title.romaji, media.title.native, media.title.english]
    .filter((t): t is string => Boolean(t && t !== title));

  const authorEdge = media.staff?.edges?.find((e) =>
    e.role?.toLowerCase().includes("story"),
  );
  const artistEdge = media.staff?.edges?.find((e) =>
    e.role?.toLowerCase().includes("art"),
  );

  return {
    id: String(media.id),
    provider: "anilist",
    title,
    altTitles,
    description: media.description?.replace(/<[^>]+>/g, "") ?? null,
    coverUrl: media.coverImage?.large ?? null,
    author: authorEdge?.node?.name?.full ?? null,
    artist: artistEdge?.node?.name?.full ?? null,
    status: mapAniListStatus(media.status),
    genres: media.genres ?? [],
  };
}

async function anilistQuery<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await cachedFetch(GRAPHQL_URL, CACHE_TTL.search, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new ProviderError(
      "PROVIDER_UNAVAILABLE",
      "AniList is temporarily unavailable.",
      502,
    );
  }

  const json = (await response.json()) as { data?: T; errors?: unknown[] };
  if (json.errors?.length || !json.data) {
    throw new ProviderError(
      "PROVIDER_UNAVAILABLE",
      "AniList returned an invalid response.",
      502,
    );
  }

  return json.data;
}

const SEARCH_QUERY = `
  query ($search: String) {
    Page(page: 1, perPage: 24) {
      media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
        id
        title { romaji english native }
        description
        coverImage { large }
        status
        genres
        staff(perPage: 5) {
          edges { role node { name { full } } }
        }
      }
    }
  }
`;

const MEDIA_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: MANGA) {
      id
      title { romaji english native }
      description
      coverImage { large }
      status
      genres
      staff(perPage: 10) {
        edges { role node { name { full } } }
      }
    }
  }
`;

export class AniListProvider implements MangaProvider {
  readonly type = "anilist" as const;

  async search(query: string): Promise<Manga[]> {
    const data = await anilistQuery<{ Page: { media: AniListMedia[] } }>(
      SEARCH_QUERY,
      { search: query },
    );
    return data.Page.media.map(normalizeAniListMedia);
  }

  async getManga(id: string): Promise<Manga> {
    const mediaId = Number.parseInt(id, 10);
    if (Number.isNaN(mediaId)) {
      throw new ProviderError("MANGA_NOT_FOUND", "Manga not found.", 404);
    }

    const data = await anilistQuery<{ Media: AniListMedia | null }>(MEDIA_QUERY, {
      id: mediaId,
    });

    if (!data.Media) {
      throw new ProviderError("MANGA_NOT_FOUND", "Manga not found.", 404);
    }

    return normalizeAniListMedia(data.Media);
  }

  async getChapters(_mangaId: string): Promise<ChapterListResult> {
    return { chapters: [], hasMore: false };
  }

  async getPages(_chapterId: string): Promise<Page[]> {
    throw new ProviderError(
      "PAGES_NOT_FOUND",
      "AniList does not provide chapter pages.",
      404,
    );
  }
}

export function normalizeAniListMediaForTest(media: AniListMedia): Manga {
  return normalizeAniListMedia(media);
}
