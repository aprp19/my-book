"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ArrowDownUp, Check, Circle } from "lucide-react";
import { ChapterListItem } from "@/components/chapter/chapter-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  chaptersInfiniteQueryOptions,
  mangaChapterProgressQueryOptions,
} from "@/lib/queries/options";
import type { MangaProviderType } from "@/types";

interface ChapterListProps {
  provider: MangaProviderType;
  mangaId: string;
  userId?: string | null;
}

export function ChapterList({ provider, mangaId, userId }: ChapterListProps) {
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

  const progressQuery = useQuery(
    mangaChapterProgressQueryOptions(provider, mangaId, Boolean(userId)),
  );

  const readChapterIds = useMemo(
    () => new Set(progressQuery.data ?? []),
    [progressQuery.data],
  );

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
          <Skeleton key={i} className="min-h-12 w-full rounded-lg" />
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
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1 space-y-1.5">
          <Label htmlFor="chapter-filter">Search chapters</Label>
          <Input
            id="chapter-filter"
            placeholder="Number or title…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          aria-pressed={ascending}
          onClick={() => setAscending((v) => !v)}
        >
          <ArrowDownUp className="size-4" aria-hidden="true" />
          Sort {ascending ? "ascending" : "descending"}
        </Button>
      </div>

      {userId ? (
        <p className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Check className="size-3.5 text-primary" aria-hidden="true" />
            Read
          </span>
          <span className="inline-flex items-center gap-1">
            <Circle className="size-3.5 text-muted-foreground/50" aria-hidden="true" />
            Unread
          </span>
        </p>
      ) : null}

      <ScrollArea
        viewportRef={viewportRef}
        onNearBottom={loadMore}
        className="h-[min(420px,50vh)] rounded-xl border border-border"
      >
        <ul className="divide-y divide-border">
          {filtered.map((chapter) => (
            <li key={chapter.id}>
              <ChapterListItem
                chapter={chapter}
                provider={provider}
                mangaId={mangaId}
                isRead={readChapterIds.has(chapter.id)}
                showReadState={Boolean(userId)}
              />
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
