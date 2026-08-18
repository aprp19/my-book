"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { upsertReadingProgress } from "@/lib/actions/user-data";
import { useReaderStore } from "@/stores/reader-store";
import type { Chapter, Page } from "@/types";
import type { MangaProviderType } from "@/types";

interface ReaderProps {
  provider: MangaProviderType;
  chapterId: string;
  mangaId: string;
  mangaTitle: string;
  chapterNumber: string | null;
  pages: Page[];
  chapters: Chapter[];
  initialPage: number;
  userId: string | null;
}

export function Reader({
  provider,
  chapterId,
  mangaId,
  mangaTitle,
  chapterNumber,
  pages,
  chapters,
  initialPage,
  userId,
}: ReaderProps) {
  const { currentPage, setCurrentPage, setTotalPages } = useReaderStore();
  const [failedPages, setFailedPages] = useState<Record<number, boolean>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setTotalPages(pages.length);
    setCurrentPage(Math.min(initialPage, Math.max(pages.length - 1, 0)));
  }, [initialPage, pages.length, setCurrentPage, setTotalPages]);

  const saveProgress = useCallback(
    (page: number) => {
      if (!userId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        startTransition(async () => {
          try {
            await upsertReadingProgress({
              provider,
              externalMangaId: mangaId,
              externalChapterId: chapterId,
              chapterNumber,
              page,
              mangaTitle,
            });
          } catch {
            // ignore save errors in reader
          }
        });
      }, 800);
    },
    [chapterId, chapterNumber, mangaId, mangaTitle, provider, startTransition, userId],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!Number.isNaN(index)) {
              setCurrentPage(index);
              saveProgress(index);
            }
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0.01 },
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pages.length, saveProgress, setCurrentPage]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") saveProgress(currentPage);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      saveProgress(currentPage);
    };
  }, [currentPage, saveProgress]);

  const sortedChapters = [...chapters].sort(
    (a, b) => Number.parseFloat(a.number ?? "0") - Number.parseFloat(b.number ?? "0"),
  );
  const currentIndex = sortedChapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < sortedChapters.length - 1
      ? sortedChapters[currentIndex + 1]
      : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur">
        <ButtonLink variant="ghost" size="sm" href={`/manga/${provider}/${mangaId}`}>
          <ChevronLeft className="size-4" />
          Back
        </ButtonLink>
        <div className="text-center text-sm">
          <p className="font-medium">{mangaTitle}</p>
          <p className="text-white/60">
            Ch. {chapterNumber ?? "?"} · {currentPage + 1}/{pages.length}
          </p>
        </div>
        <div className="flex gap-1">
          {prevChapter ? (
            <ButtonLink
              variant="ghost"
              size="icon-sm"
              href={`/read/${provider}/${encodeURIComponent(prevChapter.id)}?mangaId=${encodeURIComponent(mangaId)}`}
            >
              <ChevronLeft className="size-4" />
            </ButtonLink>
          ) : (
            <span className="size-7" />
          )}
          {nextChapter ? (
            <ButtonLink
              variant="ghost"
              size="icon-sm"
              href={`/read/${provider}/${encodeURIComponent(nextChapter.id)}?mangaId=${encodeURIComponent(mangaId)}`}
            >
              <ChevronRight className="size-4" />
            </ButtonLink>
          ) : (
            <span className="size-7" />
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col">
        {pages.map((page, index) => (
          <div
            key={page.index}
            ref={(el) => {
              pageRefs.current[index] = el;
            }}
            data-index={index}
            className="relative w-full"
          >
            {failedPages[index] ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 bg-zinc-900 p-8 text-sm">
                <p>Failed to load page {index + 1}.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setFailedPages((prev) => {
                      const next = { ...prev };
                      delete next[index];
                      return next;
                    })
                  }
                >
                  Retry
                </Button>
              </div>
            ) : (
              <Image
                src={page.imageUrl}
                alt={`Page ${index + 1}`}
                width={800}
                height={1200}
                className="h-auto w-full"
                loading={index < 3 ? "eager" : "lazy"}
                unoptimized
                onError={() => setFailedPages((prev) => ({ ...prev, [index]: true }))}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
