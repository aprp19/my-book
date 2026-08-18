"use client";

import { BookOpen, ChevronLeft, ChevronRight, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import type { Chapter } from "@/types";
import type { MangaProviderType } from "@/types";

interface ReaderChapterControlsProps {
  provider: MangaProviderType;
  mangaId: string;
  chapterNumber: string | null;
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
  onOpenPicker: () => void;
}

function chapterHref(
  provider: MangaProviderType,
  mangaId: string,
  chapterId: string,
) {
  return `/read/${provider}/${encodeURIComponent(chapterId)}?mangaId=${encodeURIComponent(mangaId)}`;
}

function mangaHref(provider: MangaProviderType, mangaId: string) {
  return `/manga/${provider}/${encodeURIComponent(mangaId)}`;
}

export function ReaderChapterControls({
  provider,
  mangaId,
  chapterNumber,
  prevChapter,
  nextChapter,
  onOpenPicker,
}: ReaderChapterControlsProps) {
  const chapterLabel = chapterNumber ? `Ch. ${chapterNumber}` : "Chapters";

  return (
    <div
      className="border-t border-border/50 bg-reader-ink/90 backdrop-blur-md"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2">
        {prevChapter ? (
          <ButtonLink
            variant="outline"
            size="icon"
            aria-label="Previous chapter"
            href={chapterHref(provider, mangaId, prevChapter.id)}
            className="shrink-0"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </ButtonLink>
        ) : (
          <Button
            variant="outline"
            size="icon"
            disabled
            aria-label="Previous chapter"
            className="shrink-0"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Button>
        )}

        <Button
          type="button"
          variant="secondary"
          aria-haspopup="dialog"
          aria-label="Choose chapter"
          className="min-h-11 min-w-0 flex-1 truncate"
          onClick={onOpenPicker}
        >
          <List className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{chapterLabel}</span>
        </Button>

        <ButtonLink
          variant="outline"
          size="icon"
          aria-label="Manga details"
          href={mangaHref(provider, mangaId)}
          className="shrink-0"
        >
          <BookOpen className="size-5" aria-hidden="true" />
        </ButtonLink>

        {nextChapter ? (
          <ButtonLink
            variant="outline"
            size="icon"
            aria-label="Next chapter"
            href={chapterHref(provider, mangaId, nextChapter.id)}
            className="shrink-0"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </ButtonLink>
        ) : (
          <Button
            variant="outline"
            size="icon"
            disabled
            aria-label="Next chapter"
            className="shrink-0"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
