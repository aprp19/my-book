"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { ReaderChapterControls } from "@/components/reader/reader-controls";
import { ReaderChapterPicker } from "@/components/reader/reader-chapter-picker";
import { upsertReadingProgress } from "@/lib/actions/user-data";
import { useReaderStore } from "@/stores/reader-store";
import { cn } from "@/lib/utils";
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
  const [chromeVisible, setChromeVisible] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const showChrome = useCallback(() => {
    setChromeVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setChromeVisible(false), 3500);
  }, []);

  useEffect(() => {
    showChrome();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showChrome]);

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

  const progress = pages.length > 0 ? ((currentPage + 1) / pages.length) * 100 : 0;
  const chromeShown = chromeVisible || pickerOpen;

  function openPicker() {
    showChrome();
    setPickerOpen(true);
  }

  return (
    <div
      className="min-h-screen bg-reader-ink text-foreground"
      onClick={showChrome}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !pickerOpen) showChrome();
      }}
    >
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-40 border-b border-border/50 bg-reader-ink/90 backdrop-blur-md transition-opacity duration-300",
          chromeShown ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
          <ButtonLink
            variant="ghost"
            size="sm"
            href={`/manga/${provider}/${mangaId}`}
            className="shrink-0 text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Back
          </ButtonLink>
          <div className="min-w-0 flex-1 text-center text-sm">
            <p className="truncate font-medium">{mangaTitle}</p>
            <p className="text-muted-foreground">
              Ch. {chapterNumber ?? "?"} · {currentPage + 1}/{pages.length}
            </p>
          </div>
          <span className="w-[4.5rem] shrink-0" aria-hidden="true" />
        </div>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col pt-14 pb-6">
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
              <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 bg-muted/30 p-8 text-sm">
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

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 transition-opacity duration-300",
          chromeShown ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <ReaderChapterControls
          provider={provider}
          mangaId={mangaId}
          chapterNumber={chapterNumber}
          prevChapter={prevChapter}
          nextChapter={nextChapter}
          onOpenPicker={openPicker}
        />
        <div
          className="h-1 bg-muted"
          role="progressbar"
          aria-valuenow={currentPage + 1}
          aria-valuemin={1}
          aria-valuemax={Math.max(pages.length, 1)}
          aria-label="Reading progress"
        >
          <div
            className="h-full bg-primary transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ReaderChapterPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        provider={provider}
        mangaId={mangaId}
        currentChapterId={chapterId}
        chapters={chapters}
        userId={userId}
      />
    </div>
  );
}
