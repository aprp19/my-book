"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MangaGrid } from "@/components/manga/manga-grid";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  continueReadingQueryOptions,
  favoritesQueryOptions,
  recentChaptersQueryOptions,
  recentViewsQueryOptions,
} from "@/lib/queries/options";
import { formatDistanceToNow } from "@/lib/utils/date";

interface HomeSectionsProps {
  userId: string | null;
}

export function HomeSections({ userId }: HomeSectionsProps) {
  const enabled = Boolean(userId);

  const continueReadingQuery = useQuery(continueReadingQueryOptions(enabled));
  const recentChaptersQuery = useQuery(recentChaptersQueryOptions(enabled));
  const recentViewsQuery = useQuery(recentViewsQueryOptions(enabled));
  const favoritesQuery = useQuery(favoritesQueryOptions(enabled));

  if (!userId) return null;

  const isLoading =
    continueReadingQuery.isLoading ||
    recentChaptersQuery.isLoading ||
    recentViewsQuery.isLoading ||
    favoritesQuery.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-10">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const continueReading = continueReadingQuery.data ?? [];
  const recentChapters = recentChaptersQuery.data ?? [];
  const recentViews = recentViewsQuery.data ?? [];
  const favorites = favoritesQuery.data ?? [];

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Continue Reading</h2>
        <MangaGrid
          items={continueReading.map((row) => ({
            id: row.external_manga_id,
            provider: row.provider,
            title: row.manga_title ?? "Unknown",
            coverUrl: null,
            subtitle: `Ch. ${row.chapter_number ?? "?"} · p.${row.page + 1}`,
            href: `/read/${row.provider}/${encodeURIComponent(row.external_chapter_id)}?mangaId=${encodeURIComponent(row.external_manga_id)}`,
          }))}
        />
      </section>

      <Separator />

      <section className="space-y-6">
        <h2 className="text-lg font-semibold">History</h2>
        <div className="space-y-4">
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Recently Read
            </h3>
            <ScrollArea className="max-h-80 rounded-lg border border-border">
              <div className="space-y-2 p-1">
                {recentChapters.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    Nothing here yet — start reading.
                  </p>
                ) : (
                  recentChapters.map((row) => (
                    <Link
                      key={row.id}
                      href={`/read/${row.provider}/${encodeURIComponent(row.external_chapter_id)}?mangaId=${encodeURIComponent(row.external_manga_id)}`}
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm hover:bg-muted/50"
                    >
                      <span>
                        {row.manga_title ?? "Unknown"} · Ch. {row.chapter_number ?? "?"}{" "}
                        · p.{row.page + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(row.updated_at)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Recently Viewed
            </h3>
            <MangaGrid
              items={recentViews.map((row) => ({
                id: row.external_manga_id,
                provider: row.provider,
                title: row.title,
                coverUrl: row.cover_url,
                subtitle: formatDistanceToNow(row.viewed_at),
              }))}
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Favorites</h2>
        <MangaGrid
          items={favorites.map((row) => ({
            id: row.external_manga_id,
            provider: row.provider,
            title: row.title,
            coverUrl: row.cover_url,
          }))}
        />
      </section>
    </div>
  );
}
