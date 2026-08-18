import "server-only";

import { getProvider } from "@/lib/providers/registry";
import type { BrowseFeed, BrowseOptions } from "@/lib/providers/types";
import type { Manga } from "@/types";
import { BROWSE_PAGE_SIZE } from "./browse-shared";

export {
  BROWSE_MAX_PAGE,
  BROWSE_PAGE_SIZE,
  buildBrowsePageUrl,
  parseBrowsePage,
  parseBrowsePages,
  type BrowsePages,
} from "./browse-shared";

export async function browseManga(
  feed: BrowseFeed,
  options: BrowseOptions = {},
): Promise<Manga[]> {
  const browseOptions: BrowseOptions = {
    limit: BROWSE_PAGE_SIZE,
    page: 1,
    ...options,
  };

  const mgeko = getProvider("mgeko");
  if (mgeko.browse) {
    try {
      return await mgeko.browse(feed, browseOptions);
    } catch {
      return [];
    }
  }

  return [];
}
