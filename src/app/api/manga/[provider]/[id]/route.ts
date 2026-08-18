import {
  apiSuccess,
  handleRouteError,
  parseIdParam,
  parseProviderParam,
} from "@/lib/api/response";
import { getProvider } from "@/lib/providers/registry";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/manga/[provider]/[id]">,
) {
  try {
    const { provider, id } = await context.params;
    const providerType = parseProviderParam(provider);
    const mangaId = parseIdParam(id, "manga ID");
    const manga = await getProvider(providerType).getManga(mangaId);
    return apiSuccess(manga);
  } catch (error) {
    return handleRouteError(error);
  }
}
