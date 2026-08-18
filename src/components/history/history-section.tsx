"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { MangaGrid } from "@/components/manga/manga-grid";
import { SectionHeader } from "@/components/layout/section-header";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button-link";
import {
  continueReadingQueryOptions,
  recentChaptersQueryOptions,
  recentViewsQueryOptions,
} from "@/lib/queries/options";
import { FavoritesSection } from "@/components/library/favorites-section";
import { formatDistanceToNow } from "@/lib/utils/date";

interface LibrarySectionsProps {
  userId: string | null;
}

export function LibrarySections({ userId }: LibrarySectionsProps) {
  const enabled = Boolean(userId);

  const continueReadingQuery = useQuery(continueReadingQueryOptions(enabled));
  const recentChaptersQuery = useQuery(recentChaptersQueryOptions(enabled));
  const recentViewsQuery = useQuery(recentViewsQueryOptions(enabled));

  if (!userId) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Sign in to track your reading"
        description="Save favorites, continue where you left off, and see your history."
        action={<ButtonLink href="/login">Sign in</ButtonLink>}
      />
    );
  }

  const isLoading =
    continueReadingQuery.isLoading ||
    recentChaptersQuery.isLoading ||
    recentViewsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-10">
        <Skeleton className="h-6 w-40" />
        <MangaGridSkeletonInline />
      </div>
    );
  }

  const continueReading = continueReadingQuery.data ?? [];
  const recentChapters = recentChaptersQuery.data ?? [];
  const recentViews = recentViewsQuery.data ?? [];

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <SectionHeader title="Continue Reading" />
        <MangaGrid
          variant="carousel"
          items={continueReading.map((row) => ({
            id: row.external_manga_id,
            provider: row.provider,
            title: row.manga_title ?? "Unknown",
            coverUrl: null,
            subtitle: `Ch. ${row.chapter_number ?? "?"} · p.${row.page + 1}`,
            href: `/read/${row.provider}/${encodeURIComponent(row.external_chapter_id)}?mangaId=${encodeURIComponent(row.external_manga_id)}`,
          }))}
          emptyMessage="Nothing in progress — pick a series to start."
        />
      </section>

      <Separator />

      <section className="space-y-6">
        <SectionHeader title="History" />
        <div className="space-y-4">
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Recently Read
            </h3>
            <ScrollArea className="h-[min(320px,50vh)] rounded-xl border border-border">
              {recentChapters.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  Nothing here yet — start reading.
                </p>
              ) : (
                <ul className="divide-y divide-border p-1">
                  {recentChapters.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={`/read/${row.provider}/${encodeURIComponent(row.external_chapter_id)}?mangaId=${encodeURIComponent(row.external_manga_id)}`}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm hover:bg-muted/50"
                      >
                        <span className="min-w-0 truncate">
                          {row.manga_title ?? "Unknown"} · Ch. {row.chapter_number ?? "?"}{" "}
                          · p.{row.page + 1}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {formatDistanceToNow(row.updated_at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Recently Viewed
            </h3>
            <MangaGrid
              variant="carousel"
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

      <FavoritesSection userId={userId} />
    </div>
  );
}

/** @deprecated Use LibrarySections */
export const HomeSections = LibrarySections;

function MangaGridSkeletonInline() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
      ))}
    </div>
  );
}
