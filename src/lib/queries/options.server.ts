import "server-only";

import { queryOptions } from "@tanstack/react-query";
import { CACHE_TTL } from "@/lib/cache/fetch";
import { browseManga } from "@/lib/data/browse";
import type { BrowseFeed, BrowseFilters } from "@/lib/providers/types";
import { queryKeys } from "./keys";

/** Same keys as browseQueryOptions; calls browseManga directly for SSR prefetch. */
export function browsePrefetchOptions(feed: BrowseFeed, page: number, filters: BrowseFilters = {}) {
  return queryOptions({
    queryKey: queryKeys.browse(feed, page, filters),
    queryFn: () => browseManga(feed, { ...filters, page }),
    staleTime: CACHE_TTL.manga * 1000,
  });
}
