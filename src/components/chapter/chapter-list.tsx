"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { chaptersInfiniteQueryOptions } from "@/lib/queries/options";
import type { MangaProviderType } from "@/types";

interface ChapterListProps {
  provider: MangaProviderType;
  mangaId: string;
}

export function ChapterList({ provider, mangaId }: ChapterListProps) {
  const [filter, setFilter] = useState("");
  const [ascending, setAscending] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery(chaptersInfiniteQueryOptions(provider, mangaId));

  const chapters = useMemo(
    () => data?.pages.flatMap((page) => page.chapters) ?? [],
    [data],
  );

  const filtered = useMemo(() => {
    const list = chapters.filter((chapter) => {
      const haystack = `${chapter.number ?? ""} ${chapter.title ?? ""}`.toLowerCase();
      return haystack.includes(filter.toLowerCase());
    });
    return [...list].sort((a, b) => {
      const an = Number.parseFloat(a.number ?? "0");
      const bn = Number.parseFloat(b.number ?? "0");
      return ascending ? an - bn : bn - an;
    });
  }, [ascending, chapters, filter]);

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: 0 });
  }, [filter, ascending]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    if (el.scrollHeight <= el.clientHeight + 1) loadMore();
  }, [chapters.length, filtered.length, hasNextPage, isFetchingNextPage, loadMore]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "Could not load chapters."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Filter chapters..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <button
          type="button"
          onClick={() => setAscending((v) => !v)}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Sort {ascending ? "asc" : "desc"}
        </button>
      </div>
      <ScrollArea
        viewportRef={viewportRef}
        onNearBottom={loadMore}
        className="h-[420px] rounded-lg border border-border"
      >
        <ul className="divide-y divide-border">
          {filtered.map((chapter) => (
            <li key={chapter.id}>
              <Link
                href={`/read/${provider}/${encodeURIComponent(chapter.id)}?mangaId=${encodeURIComponent(mangaId)}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/50"
              >
                <span>
                  Ch. {chapter.number ?? "?"}
                  {chapter.title ? ` — ${chapter.title}` : ""}
                </span>
                {chapter.language ? (
                  <span className="text-xs uppercase text-muted-foreground">
                    {chapter.language}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
        {isFetchingNextPage ? (
          <p className="px-4 py-3 text-center text-xs text-muted-foreground">
            Loading more chapters…
          </p>
        ) : hasNextPage ? (
          <p className="px-4 py-3 text-center text-xs text-muted-foreground">
            Scroll for more chapters ({chapters.length} loaded)
          </p>
        ) : chapters.length > 0 ? (
          <p className="px-4 py-3 text-center text-xs text-muted-foreground">
            All {chapters.length} chapters loaded
          </p>
        ) : (
          <p className="px-4 py-3 text-center text-sm text-muted-foreground">
            No chapters found.
          </p>
        )}
      </ScrollArea>
    </div>
  );
}
