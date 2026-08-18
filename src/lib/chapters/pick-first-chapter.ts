import type { Chapter } from "@/types";

function chapterSortKey(number: string | null): number {
  return Number.parseFloat(number ?? "0");
}

export function pickFirstChapter(chapters: Chapter[]): Chapter | null {
  if (chapters.length === 0) return null;
  return chapters.toSorted(
    (a, b) => chapterSortKey(a.number) - chapterSortKey(b.number),
  )[0]!;
}
