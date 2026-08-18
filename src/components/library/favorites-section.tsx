"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { MangaGrid } from "@/components/manga/manga-grid";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseFavoritesPage } from "@/lib/favorites/constants";
import { favoritesQueryOptions } from "@/lib/queries/options";
import { formatChapterReleaseDate } from "@/lib/utils/date";
import type { MangaProviderType } from "@/types";

interface FavoritesSectionProps {
  userId: string;
}

export function FavoritesSection({ userId: _userId }: FavoritesSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionRef = useRef<HTMLElement>(null);
  const page = parseFavoritesPage(searchParams.get("page"));

  const { data, isLoading, isFetching, error } = useQuery(
    favoritesQueryOptions(true, page),
  );

  const favorites = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;
  const hasPrevious = page > 1;
  const hasNext = page < pageCount;
  const loading = isLoading && !data;
  const errorMessage = error instanceof Error ? error.message : null;

  useEffect(() => {
    if (data && page > data.pageCount) {
      goToPage(Math.max(1, data.pageCount));
    }
  }, [data, page]);

  useEffect(() => {
    if (page > 1) {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [page]);

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const query = params.toString();
    router.push(query ? `/library?${query}` : "/library");
  }

  return (
    <section ref={sectionRef} id="favorites" className="scroll-mt-6 space-y-4">
      <SectionHeader title="Favorites" />

      {isFetching && !loading ? (
        <p
          className="flex items-center gap-2 text-sm text-muted-foreground"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Updating favorites…
        </p>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-xl" />
          ))}
        </div>
      ) : null}

      {errorMessage ? (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {!loading && !errorMessage ? (
        <>
          {total > 0 ? (
            <p className="text-sm text-muted-foreground tabular-nums">
              {total} favorite{total === 1 ? "" : "s"}
              {pageCount > 1 ? ` · Page ${page} of ${pageCount}` : null}
            </p>
          ) : null}

          <MangaGrid
            variant="grid"
            items={favorites.map((row) => ({
              id: row.external_manga_id,
              provider: row.provider as MangaProviderType,
              title: row.title,
              coverUrl: row.cover_url,
              subtitle:
                formatChapterReleaseDate(row.lastChapterUpdatedAt) ?? undefined,
              hasNewChapter: row.hasNewChapter,
            }))}
            emptyMessage="No favorites yet — heart a series on its detail page."
          />

          {pageCount > 1 ? (
            <nav
              aria-label="Favorites pagination"
              className="flex items-center justify-center gap-2 border-t border-border pt-4"
            >
              <Button
                variant="outline"
                disabled={!hasPrevious}
                onClick={() => goToPage(page - 1)}
                className="min-w-[120px]"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Previous
              </Button>
              <span className="min-w-20 text-center text-sm text-muted-foreground tabular-nums">
                Page {page}
              </span>
              <Button
                variant="outline"
                disabled={!hasNext}
                onClick={() => goToPage(page + 1)}
                className="min-w-[120px]"
              >
                Next
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </nav>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
