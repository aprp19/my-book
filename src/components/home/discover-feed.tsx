"use client";

import { useQuery } from "@tanstack/react-query";
import { MangaGrid } from "@/components/manga/manga-grid";
import { SectionHeader } from "@/components/layout/section-header";
import { DiscoverPagination } from "@/components/home/discover-pagination";
import { MangaGridSkeleton } from "@/components/home/manga-grid-skeleton";
import type { BrowsePages } from "@/lib/data/browse-shared";
import { browseQueryOptions } from "@/lib/queries/options";
import { formatChapterReleaseDate } from "@/lib/utils/date";
import type { BrowseFeed } from "@/lib/providers/types";

interface DiscoverFeedProps {
  feed: BrowseFeed;
  title: string;
  page: number;
  pages: BrowsePages;
}

export function DiscoverFeed({ feed, title, page, pages }: DiscoverFeedProps) {
  const { data: items = [], isLoading, error } = useQuery(browseQueryOptions(feed, page));

  return (
    <section className="space-y-4">
      <SectionHeader title={title} seeAllHref="/browse" />
      {isLoading ? (
        <MangaGridSkeleton variant="carousel" />
      ) : error || items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Couldn't load this list."}
        </p>
      ) : (
        <>
          <MangaGrid
            variant="carousel"
            items={items.map((manga) => ({
              id: manga.id,
              provider: manga.provider,
              title: manga.title,
              coverUrl: manga.coverUrl,
              subtitle: formatChapterReleaseDate(manga.lastUpdatedAt) ?? undefined,
            }))}
          />
          <DiscoverPagination
            feed={feed}
            page={page}
            itemCount={items.length}
            pages={pages}
          />
        </>
      )}
    </section>
  );
}
