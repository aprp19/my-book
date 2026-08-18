"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChapterList } from "@/components/chapter/chapter-list";
import { FavoriteButton } from "@/components/manga/favorite-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { upsertMangaView } from "@/lib/actions/user-data";
import { chaptersPageQueryOptions, favoriteStatusQueryOptions, mangaQueryOptions } from "@/lib/queries/options";
import { ProviderError } from "@/lib/providers/errors";
import type { MangaProviderType } from "@/types";

interface MangaDetailProps {
  provider: MangaProviderType;
  id: string;
  userId: string | null;
}

export function MangaDetail({ provider, id, userId }: MangaDetailProps) {
  const mangaQuery = useQuery(mangaQueryOptions(provider, id));
  const latestChapterQuery = useQuery(chaptersPageQueryOptions(provider, id, 1));
  const favoriteQuery = useQuery(favoriteStatusQueryOptions(provider, id, Boolean(userId)));

  const manga = mangaQuery.data;

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
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <Skeleton className="aspect-[2/3] w-[220px] rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
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
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-muted-foreground">
          {mangaQuery.error instanceof Error
            ? mangaQuery.error.message
            : "Could not load manga."}
        </p>
      </div>
    );
  }

  if (!manga) {
    notFound();
  }

  const latestChapter = latestChapterQuery.data?.chapters[0];
  const favorited = favoriteQuery.data ?? false;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">
            <div className="relative aspect-[2/3] bg-muted">
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
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{manga.title}</h1>
              <Badge variant="secondary">{provider}</Badge>
            </div>
            {manga.altTitles.length > 0 ? (
              <p className="text-sm text-muted-foreground">{manga.altTitles.join(" · ")}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {manga.author ? <span>Author: {manga.author}</span> : null}
            {manga.artist ? <span>Artist: {manga.artist}</span> : null}
            {manga.status ? <span>Status: {manga.status}</span> : null}
          </div>

          {manga.genres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {manga.genres.map((genre) => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
            </div>
          ) : null}

          {manga.description ? (
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              {manga.description}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {userId ? (
              <FavoriteButton
                provider={provider}
                externalMangaId={id}
                title={manga.title}
                coverUrl={manga.coverUrl}
                initialFavorited={favorited}
              />
            ) : null}
            {latestChapter && provider !== "anilist" ? (
              <ButtonLink
                href={`/read/${provider}/${encodeURIComponent(latestChapter.id)}?mangaId=${encodeURIComponent(id)}`}
              >
                Continue reading
              </ButtonLink>
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
          <h2 className="text-xl font-semibold">Chapters</h2>
          <ChapterList provider={provider} mangaId={id} />
        </section>
      )}
    </div>
  );
}
