"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp, X } from "lucide-react";
import { ChapterListItem } from "@/components/chapter/chapter-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mangaChapterProgressQueryOptions } from "@/lib/queries/options";
import { cn } from "@/lib/utils";
import type { Chapter } from "@/types";
import type { MangaProviderType } from "@/types";

interface ReaderChapterPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: MangaProviderType;
  mangaId: string;
  currentChapterId: string;
  chapters: Chapter[];
  userId?: string | null;
}

export function ReaderChapterPicker({
  open,
  onOpenChange,
  provider,
  mangaId,
  currentChapterId,
  chapters,
  userId,
}: ReaderChapterPickerProps) {
  const [filter, setFilter] = useState("");
  const [ascending, setAscending] = useState(false);
  const currentRowRef = useRef<HTMLAnchorElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const progressQuery = useQuery(
    mangaChapterProgressQueryOptions(provider, mangaId, Boolean(userId)),
  );

  const readChapterIds = useMemo(
    () => new Set(progressQuery.data ?? []),
    [progressQuery.data],
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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setFilter("");
      setAscending(false);
      return;
    }
    const id = requestAnimationFrame(() => {
      currentRowRef.current?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(id);
  }, [open, currentChapterId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close chapter list"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reader-chapter-picker-title"
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl border border-border bg-card shadow-lg",
          "pb-[env(safe-area-inset-bottom)] overscroll-contain sm:mx-auto sm:max-w-lg sm:rounded-2xl sm:bottom-8",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="reader-chapter-picker-title" className="text-lg font-semibold">
            Chapters
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close chapter list"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-3 border-b border-border px-4 py-3">
          <div className="space-y-1.5">
            <Label htmlFor="reader-chapter-filter">Search chapters</Label>
            <Input
              id="reader-chapter-filter"
              placeholder="Number or title…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={ascending}
            onClick={() => setAscending((v) => !v)}
          >
            <ArrowDownUp className="size-4" aria-hidden="true" />
            Sort {ascending ? "ascending" : "descending"}
          </Button>
        </div>

        <div ref={listRef} className="overflow-y-auto px-2 py-2">
          <ul className="divide-y divide-border">
            {filtered.map((chapter) => {
              const isCurrent = chapter.id === currentChapterId;
              return (
                <li key={chapter.id}>
                  <ChapterListItem
                    chapter={chapter}
                    provider={provider}
                    mangaId={mangaId}
                    isRead={readChapterIds.has(chapter.id)}
                    isCurrent={isCurrent}
                    showReadState={Boolean(userId)}
                    linkRef={isCurrent ? currentRowRef : undefined}
                    onNavigate={() => onOpenChange(false)}
                    className="rounded-lg px-3"
                  />
                </li>
              );
            })}
          </ul>
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No chapters match your search.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
