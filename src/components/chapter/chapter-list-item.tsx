"use client";

import Link from "next/link";
import type { Ref } from "react";
import { Check, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatChapterReleaseDate,
  toIsoDateString,
} from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { Chapter } from "@/types";
import type { MangaProviderType } from "@/types";

interface ChapterListItemProps {
  chapter: Chapter;
  provider: MangaProviderType;
  mangaId: string;
  isRead?: boolean;
  isCurrent?: boolean;
  showReadState?: boolean;
  onNavigate?: () => void;
  linkRef?: Ref<HTMLAnchorElement>;
  className?: string;
}

function chapterHref(
  provider: MangaProviderType,
  mangaId: string,
  chapterId: string,
) {
  return `/read/${provider}/${encodeURIComponent(chapterId)}?mangaId=${encodeURIComponent(mangaId)}`;
}

export function ChapterListItem({
  chapter,
  provider,
  mangaId,
  isRead = false,
  isCurrent = false,
  showReadState = false,
  onNavigate,
  linkRef,
  className,
}: ChapterListItemProps) {
  const releaseLabel = formatChapterReleaseDate(chapter.publishedAt);
  const releaseIso = toIsoDateString(chapter.publishedAt);
  const readLabel = showReadState ? (isRead ? "read" : "unread") : null;
  const ariaLabel = [
    `Chapter ${chapter.number ?? "?"}`,
    chapter.title,
    readLabel,
    releaseLabel,
  ]
    .filter(Boolean)
    .join(", ");

  const StatusIcon = isRead ? Check : Circle;

  return (
    <Link
      ref={linkRef}
      href={chapterHref(provider, mangaId, chapter.id)}
      aria-current={isCurrent ? "page" : undefined}
      aria-label={ariaLabel}
      onClick={onNavigate}
      className={cn(
        "flex min-h-12 items-center gap-2 px-4 py-3 text-sm hover:bg-muted/50",
        isCurrent && "bg-primary/10 font-medium text-primary",
        isRead && showReadState && !isCurrent && "text-muted-foreground",
        className,
      )}
    >
      {showReadState ? (
        <StatusIcon
          className={cn(
            "size-4 shrink-0",
            isRead ? "text-primary" : "text-muted-foreground/50",
          )}
          aria-hidden="true"
        />
      ) : null}
      <span className="min-w-0 flex-1 truncate">
        Ch. {chapter.number ?? "?"}
        {chapter.title ? ` — ${chapter.title}` : ""}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {chapter.language ? (
          <Badge variant="secondary" className="uppercase">
            {chapter.language}
          </Badge>
        ) : null}
        {releaseLabel ? (
          <time
            dateTime={releaseIso ?? undefined}
            className="text-xs text-muted-foreground tabular-nums"
          >
            {releaseLabel}
          </time>
        ) : null}
      </span>
    </Link>
  );
}
