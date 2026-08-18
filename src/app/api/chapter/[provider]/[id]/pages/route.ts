import {
  apiSuccess,
  handleRouteError,
  parseIdParam,
  parseProviderParam,
} from "@/lib/api/response";
import { getProvider } from "@/lib/providers/registry";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/chapter/[provider]/[id]/pages">,
) {
  try {
    const { provider, id } = await context.params;
    const providerType = parseProviderParam(provider);
    const chapterId = parseIdParam(id, "chapter ID");
    const pages = await getProvider(providerType).getPages(chapterId);
    return apiSuccess(pages);
  } catch (error) {
    return handleRouteError(error);
  }
}
