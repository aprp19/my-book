"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BrowseSection, buildBrowseParams, parseBrowseFilters } from "@/components/home/browse-filters";
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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Browse</h1>
        <p className="text-sm text-muted-foreground">
          {filters.q
            ? `Results for “${filters.q}”`
            : "Search and filter manga and manhwa from Mgeko."}
        </p>
      </div>

      <BrowseSection hideTitle initialFilters={filters} />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-xl" />
          ))}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          {errorMessage}
        </div>
      ) : null}

      {!loading && !errorMessage ? (
        <>
          <MangaGrid items={results} />
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="min-w-16 text-center text-sm text-muted-foreground">
              Page {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={results.length < 24}
              onClick={() => goToPage(page + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
