import {
  apiSuccess,
  handleRouteError,
  parseIdParam,
  parseProviderParam,
} from "@/lib/api/response";
import type { MangaProvider } from "@/lib/providers/types";
import { getProvider } from "@/lib/providers/registry";
import type { Chapter } from "@/types";

const DEFAULT_CHAPTER_PAGE_SIZE = 50;
const MAX_CHAPTER_PAGES = 100;

async function fetchAllChapters(
  provider: MangaProvider,
  mangaId: string,
): Promise<Chapter[]> {
  const all: Chapter[] = [];

  for (let page = 1; page <= MAX_CHAPTER_PAGES; page++) {
    const { chapters, hasMore } = await provider.getChapters(mangaId, {
      page,
      limit: DEFAULT_CHAPTER_PAGE_SIZE,
    });
    all.push(...chapters);
    if (!hasMore) break;
  }

  return all;
}

export async function GET(
  request: Request,
  context: RouteContext<"/api/manga/[provider]/[id]/chapters">,
) {
  try {
    const { provider, id } = await context.params;
    const providerType = parseProviderParam(provider);
    const mangaId = parseIdParam(id, "manga ID");
    const mangaProvider = getProvider(providerType);

    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");

    if (pageParam) {
      const page = Number.parseInt(pageParam, 10);
      const limit = Number.parseInt(
        url.searchParams.get("limit") ?? String(DEFAULT_CHAPTER_PAGE_SIZE),
        10,
      );
      const result = await mangaProvider.getChapters(mangaId, {
        page: Number.isFinite(page) && page > 0 ? page : 1,
        limit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_CHAPTER_PAGE_SIZE,
      });
      return apiSuccess(result);
    }

    const chapters = await fetchAllChapters(mangaProvider, mangaId);
    return apiSuccess({ chapters, hasMore: false });
  } catch (error) {
    return handleRouteError(error);
  }
}
