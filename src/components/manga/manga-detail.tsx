"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChapterList } from "@/components/chapter/chapter-list";
import { FavoriteButton } from "@/components/manga/favorite-button";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/ui/skeleton";
import { upsertMangaView } from "@/lib/actions/user-data";
import { pickFirstChapter } from "@/lib/chapters/pick-first-chapter";
import {
  chaptersQueryOptions,
  favoriteStatusQueryOptions,
  mangaQueryOptions,
  mangaReadingResumeQueryOptions,
} from "@/lib/queries/options";
import { ProviderError } from "@/lib/providers/errors";
import type { MangaProviderType } from "@/types";

interface MangaDetailProps {
  provider: MangaProviderType;
  id: string;
  userId: string | null;
}

export function MangaDetail({ provider, id, userId }: MangaDetailProps) {
  const mangaQuery = useQuery(mangaQueryOptions(provider, id));
  const resumeQuery = useQuery(
    mangaReadingResumeQueryOptions(provider, id, Boolean(userId)),
  );
  const chaptersQuery = useQuery({
    ...chaptersQueryOptions(provider, id),
    enabled:
      provider !== "anilist" &&
      (!userId || (!resumeQuery.isLoading && !resumeQuery.data)),
  });
  const favoriteQuery = useQuery(favoriteStatusQueryOptions(provider, id, Boolean(userId)));

  const manga = mangaQuery.data;

  const { readHref, readLabel, readLoading } = useMemo(() => {
    if (provider === "anilist") {
      return { readHref: null, readLabel: "", readLoading: false };
    }

    const resume = resumeQuery.data;
    const firstChapter = pickFirstChapter(chaptersQuery.data ?? []);
    const targetChapterId = resume?.chapterId ?? firstChapter?.id ?? null;
    const readHref = targetChapterId
      ? `/read/${provider}/${encodeURIComponent(targetChapterId)}?mangaId=${encodeURIComponent(id)}`
      : null;
    const readLabel = resume
      ? `Continue reading · Ch. ${resume.chapterNumber ?? "?"}`
      : "Start reading";
    const readLoading =
      Boolean(userId) && resumeQuery.isLoading
        ? true
        : !resume && chaptersQuery.isLoading;

    return { readHref, readLabel, readLoading };
  }, [
    provider,
    id,
    userId,
    resumeQuery.data,
    resumeQuery.isLoading,
    chaptersQuery.data,
    chaptersQuery.isLoading,
  ]);

  useEffect(() => {
    if (!userId || !manga) return;
    void upsertMangaView({
      provider,
      externalMangaId: id,
      title: manga.title,
      coverUrl: manga.coverUrl,
    }).catch(() => {});
  }, [userId, manga, provider, id]);

  if (mangaQuery.isLoading) {
    return (
      <AppShell className="space-y-8">
        <div className="grid gap-8 md:grid-cols-[min(220px,100%)_1fr]">
          <Skeleton className="aspect-[2/3] w-full max-w-[220px] rounded-xl md:mx-0" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (mangaQuery.error) {
    if (
      mangaQuery.error instanceof ProviderError &&
      mangaQuery.error.code === "MANGA_NOT_FOUND"
    ) {
      notFound();
    }
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">
          {mangaQuery.error instanceof Error
            ? mangaQuery.error.message
            : "Could not load manga."}
        </p>
      </AppShell>
    );
  }

  if (!manga) {
    notFound();
  }

  const favorited = favoriteQuery.data ?? false;

  return (
    <AppShell className="space-y-8 pb-28 md:pb-10">
      <div className="-mx-4 overflow-hidden md:mx-0 md:rounded-xl">
        <div className="relative aspect-[16/9] max-h-72 w-full bg-muted md:hidden">
          {manga.coverUrl ? (
            <Image
              src={manga.coverUrl}
              alt=""
              fill
              className="object-cover object-top"
              sizes="100vw"
              priority
              unoptimized
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[min(220px,100%)_1fr] md:items-start">
        <div className="hidden md:block">
          <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted">
            {manga.coverUrl ? (
              <Image
                src={manga.coverUrl}
                alt={manga.title}
                fill
                className="object-cover"
                sizes="220px"
                unoptimized
              />
            ) : null}
          </div>
        </div>

        <div className="space-y-4 md:-mt-0">
          <PageHeader
            title={manga.title}
            description={
              manga.altTitles.length > 0 ? manga.altTitles.join(" · ") : undefined
            }
            actions={<Badge variant="secondary">{provider}</Badge>}
          />

          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {manga.author ? (
              <div>
                <dt className="sr-only">Author</dt>
                <dd>Author: {manga.author}</dd>
              </div>
            ) : null}
            {manga.artist ? (
              <div>
                <dt className="sr-only">Artist</dt>
                <dd>Artist: {manga.artist}</dd>
              </div>
            ) : null}
            {manga.status ? (
              <div>
                <dt className="sr-only">Status</dt>
                <dd>Status: {manga.status}</dd>
              </div>
            ) : null}
          </dl>

          {manga.genres.length > 0 ? (
            <div className="chip-row">
              {manga.genres.map((genre) => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
            </div>
          ) : null}

          {manga.description ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {manga.description}
            </p>
          ) : null}

          <div className="hidden flex-wrap gap-2 md:flex">
            {userId ? (
              <FavoriteButton
                provider={provider}
                externalMangaId={id}
                title={manga.title}
                coverUrl={manga.coverUrl}
                initialFavorited={favorited}
              />
            ) : null}
            {readLoading ? (
              <Button disabled>{readLabel}</Button>
            ) : readHref ? (
              <ButtonLink href={readHref}>{readLabel}</ButtonLink>
            ) : null}
          </div>
        </div>
      </div>

      {provider === "anilist" ? (
        <p className="text-sm text-muted-foreground">
          AniList provides metadata only. Search the same title on ComicK or MangaDex to read
          chapters.
        </p>
      ) : (
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-semibold">Chapters</h2>
          <ChapterList provider={provider} mangaId={id} userId={userId} />
        </section>
      )}

      {provider !== "anilist" ? (
        <div
          className="fixed inset-x-0 bottom-14 z-40 border-t border-border bg-background/95 p-4 backdrop-blur-md md:hidden"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-lg gap-2">
            {readLoading ? (
              <Button className="min-h-11 flex-1" disabled>
                {readLabel}
              </Button>
            ) : readHref ? (
              <ButtonLink href={readHref} className="min-h-11 flex-1">
                {readLabel}
              </ButtonLink>
            ) : null}
            {userId ? (
              <FavoriteButton
                provider={provider}
                externalMangaId={id}
                title={manga.title}
                coverUrl={manga.coverUrl}
                initialFavorited={favorited}
                className="min-h-11 shrink-0"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
