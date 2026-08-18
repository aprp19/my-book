"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { notFound } from "next/navigation";
import { Reader } from "@/components/reader/reader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  chaptersQueryOptions,
  mangaQueryOptions,
  pagesQueryOptions,
  readingProgressQueryOptions,
} from "@/lib/queries/options";
import { ProviderError } from "@/lib/providers/errors";
import type { MangaProviderType } from "@/types";

interface ReaderLoaderProps {
  provider: MangaProviderType;
  chapterId: string;
  mangaId: string;
  userId: string | null;
}

export function ReaderLoader({ provider, chapterId, mangaId, userId }: ReaderLoaderProps) {
  const [resolvedChapterId, setResolvedChapterId] = useState(chapterId);
  const attemptedFallbackIds = useRef(new Set<string>());

  const pagesQuery = useQuery(pagesQueryOptions(provider, resolvedChapterId));
  const chaptersQuery = useQuery(chaptersQueryOptions(provider, mangaId));
  const mangaQuery = useQuery(mangaQueryOptions(provider, mangaId));
  const progressQuery = useQuery(
    readingProgressQueryOptions(
      provider,
      resolvedChapterId,
      Boolean(userId),
    ),
  );

  const isLoading =
    pagesQuery.isLoading || chaptersQuery.isLoading || mangaQuery.isLoading;
  const fatalError = pagesQuery.error ?? mangaQuery.error;

  const pages = pagesQuery.data;
  const chapters = chaptersQuery.data;
  const manga = mangaQuery.data;

  const chapter = useMemo(
    () => chapters?.find((c) => c.id === resolvedChapterId),
    [chapters, resolvedChapterId],
  );
  const initialPage = progressQuery.data ?? 0;

  useEffect(() => {
    if (!chaptersQuery.data) return;
    if (!(pagesQuery.error instanceof ProviderError)) return;
    if (pagesQuery.error.code !== "PAGES_NOT_FOUND") return;

    const chaptersList = chaptersQuery.data;
    const currentIndex = chaptersList.findIndex((c) => c.id === resolvedChapterId);
    if (currentIndex === -1) return;

    // Try a few neighbors; many series are sorted descending from the provider,
    // but either neighbor being available usually lets the user continue reading.
    const candidateIndexes = [
      currentIndex - 1,
      currentIndex + 1,
      currentIndex - 2,
      currentIndex + 2,
      currentIndex - 3,
      currentIndex + 3,
    ].filter((i) => i >= 0 && i < chaptersList.length);

    const nextId = candidateIndexes
      .map((i) => chaptersList[i]?.id)
      .find((id): id is string => Boolean(id) && !attemptedFallbackIds.current.has(id));

    if (!nextId) return;
    attemptedFallbackIds.current.add(nextId);
    setResolvedChapterId(nextId);
  }, [chaptersQuery.data, pagesQuery.error, resolvedChapterId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-4">
        <Skeleton className="mx-auto mb-4 h-12 max-w-3xl" />
        <Skeleton className="mx-auto aspect-[2/3] max-w-3xl" />
      </div>
    );
  }

  if (fatalError) {
    if (fatalError instanceof ProviderError && fatalError.code === "MANGA_NOT_FOUND") {
      notFound();
    }
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">
        {fatalError instanceof Error ? fatalError.message : "Could not load chapter."}
      </div>
    );
  }

  if (!pages?.length || !chapters || !manga) {
    notFound();
  }

  return (
    <Reader
      provider={provider}
      chapterId={resolvedChapterId}
      mangaId={mangaId}
      mangaTitle={manga.title}
      chapterNumber={chapter?.number ?? null}
      pages={pages}
      chapters={chapters}
      initialPage={initialPage}
      userId={userId}
    />
  );
}
