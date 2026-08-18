import type { BrowseFeed } from "@/lib/providers/types";

export const BROWSE_PAGE_SIZE = 18;
export const BROWSE_MAX_PAGE = 50;

export type BrowsePages = Record<BrowseFeed, number>;

const FEED_PARAMS: Record<BrowseFeed, keyof BrowsePageSearchParams> = {
  "recently-added": "recent",
  "latest-updates": "updates",
  popular: "popular",
};

type BrowsePageSearchParams = {
  recent?: string | string[];
  updates?: string | string[];
  popular?: string | string[];
};

export function parseBrowsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.min(parsed, BROWSE_MAX_PAGE);
}

export function parseBrowsePages(
  searchParams: BrowsePageSearchParams,
): BrowsePages {
  return {
    "recently-added": parseBrowsePage(searchParams.recent),
    "latest-updates": parseBrowsePage(searchParams.updates),
    popular: parseBrowsePage(searchParams.popular),
  };
}

export function buildBrowsePageUrl(
  feed: BrowseFeed,
  page: number,
  pages: BrowsePages,
): string {
  const nextPages: BrowsePages = { ...pages, [feed]: page };
  const params = new URLSearchParams();

  for (const feedKey of Object.keys(FEED_PARAMS) as BrowseFeed[]) {
    const pageNumber = nextPages[feedKey];
    if (pageNumber > 1) {
      params.set(FEED_PARAMS[feedKey], String(pageNumber));
    }
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}
