"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  BrowseFiltersRoot,
  buildBrowseParams,
  parseBrowseFilters,
} from "@/components/home/browse-filters";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MangaGrid } from "@/components/manga/manga-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { browseQueryOptions } from "@/lib/queries/options";

export function BrowsePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const filters = useMemo(() => parseBrowseFilters(searchParams), [searchParams]);

  const { data: results = [], isLoading, isFetching, error } = useQuery({
    ...browseQueryOptions("recently-added", page, filters),
    placeholderData: keepPreviousData,
  });

  const loading = isLoading || (isFetching && results.length === 0);
  const errorMessage = error instanceof Error ? error.message : null;

  function goToPage(nextPage: number) {
    const params = buildBrowseParams(filters, nextPage);
    const query = params.toString();
    router.push(query ? `/browse?${query}` : "/browse");
  }

  return (
    <AppShell className="space-y-6">
      <PageHeader
        title="Browse"
        description={
          filters.q
            ? `Results for “${filters.q}”`
            : "Search and filter manga and manhwa from Mgeko."
        }
      />

      <BrowseFiltersRoot initialFilters={filters} sticky showChips />

      {isFetching && !loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Updating results…
        </p>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
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
          <p className="text-sm text-muted-foreground tabular-nums">
            {results.length} result{results.length === 1 ? "" : "s"} · Page {page}
          </p>
          <MangaGrid items={results} />
          <nav
            aria-label="Browse pagination"
            className="flex items-center justify-center gap-2 border-t border-border pt-4"
          >
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="min-w-[120px]"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Previous
            </Button>
            <span className="min-w-16 text-center text-sm text-muted-foreground tabular-nums">
              Page {page}
            </span>
            <Button
              variant="outline"
              disabled={results.length < 24}
              onClick={() => goToPage(page + 1)}
              className="min-w-[120px]"
            >
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </nav>
        </>
      ) : null}
    </AppShell>
  );
}
