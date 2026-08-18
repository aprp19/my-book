import {
  apiSuccess,
  handleRouteError,
  parseSearchQuery,
} from "@/lib/api/response";
import { getSearchProviders } from "@/lib/providers/registry";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchQuery(searchParams.get("q"));
    const providerParam = searchParams.get("provider");

    const providers = providerParam
      ? getSearchProviders().filter((p) => p.type === providerParam)
      : getSearchProviders();

    const results = await Promise.all(
      providers.map(async (provider) => {
        try {
          return await provider.search(query);
        } catch {
          return [];
        }
      }),
    );

    const merged = results.flat().slice(0, 24);

    return apiSuccess(
      merged.map((manga) => ({
        id: manga.id,
        provider: manga.provider,
        title: manga.title,
        coverUrl: manga.coverUrl,
      })),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
