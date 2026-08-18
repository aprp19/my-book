"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MgekoAuthError } from "@/lib/providers/mgeko-auth-fetch";
import {
  fetchMgekoBookmarks,
  fetchMgekoReadChapters,
  type MgekoBookmark,
} from "@/lib/providers/mgeko-sync";

const MAX_SERIES = 200;
const MAX_CHAPTERS = 5000;
const CONCURRENCY = 4;
const SESSION_ID_PATTERN = /^[\w-]{16,128}$/;

export interface MgekoSyncResult {
  favoritesImported: number;
  chaptersMarkedRead: number;
  seriesProcessed: number;
  errors: { mangaId: string; message: string }[];
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return { supabase, user };
}

async function upsertSyncedFavorite(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  bookmark: MgekoBookmark,
) {
  const { error } = await supabase.from("favorites").upsert(
    {
      user_id: userId,
      provider: "mgeko",
      external_manga_id: bookmark.mangaId,
      title: bookmark.title,
      cover_url: bookmark.coverUrl,
    },
    { onConflict: "user_id,provider,external_manga_id" },
  );
  if (error) throw error;
}

async function upsertSyncedReadingProgressBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  bookmark: MgekoBookmark,
  chapters: { chapterId: string; chapterNumber: string | null }[],
) {
  if (chapters.length === 0) return;

  const chapterIds = chapters.map((c) => c.chapterId);
  const { data: existingRows } = await supabase
    .from("reading_progress")
    .select("external_chapter_id, page")
    .eq("user_id", userId)
    .eq("provider", "mgeko")
    .in("external_chapter_id", chapterIds);

  const pageByChapter = new Map(
    (existingRows ?? []).map((row) => [row.external_chapter_id, row.page]),
  );

  const rows = chapters.map((chapter) => {
    const existingPage = pageByChapter.get(chapter.chapterId);
    const page = existingPage && existingPage > 0 ? existingPage : 0;
    return {
      user_id: userId,
      provider: "mgeko" as const,
      external_manga_id: bookmark.mangaId,
      external_chapter_id: chapter.chapterId,
      chapter_number: chapter.chapterNumber,
      manga_title: bookmark.title,
      page,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase
    .from("reading_progress")
    .upsert(rows, { onConflict: "user_id,provider,external_chapter_id" });
  if (error) throw error;
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>,
) {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      await fn(items[current], current);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
}

export async function syncFromMgeko(sessionId: string): Promise<MgekoSyncResult> {
  const trimmed = sessionId.trim();
  if (!trimmed || !SESSION_ID_PATTERN.test(trimmed)) {
    throw new Error("Enter a valid mgeko sessionid cookie value.");
  }

  const { user, supabase } = await requireUser();

  let bookmarks;
  try {
    bookmarks = await fetchMgekoBookmarks(trimmed);
  } catch (error) {
    if (error instanceof MgekoAuthError) {
      throw new Error(error.message);
    }
    throw error;
  }

  const series = bookmarks.slice(0, MAX_SERIES);
  const result: MgekoSyncResult = {
    favoritesImported: 0,
    chaptersMarkedRead: 0,
    seriesProcessed: 0,
    errors: [],
  };

  if (series.length < bookmarks.length) {
    result.errors.push({
      mangaId: "*",
      message: `Imported first ${MAX_SERIES} of ${bookmarks.length} bookmarks (limit reached).`,
    });
  }

  let chaptersImported = 0;

  await mapPool(series, CONCURRENCY, async (bookmark) => {
    try {
      await upsertSyncedFavorite(supabase, user.id, bookmark);
      result.favoritesImported += 1;

      const readChapters = await fetchMgekoReadChapters(trimmed, bookmark.mangaId);
      const chaptersToImport: { chapterId: string; chapterNumber: string | null }[] = [];

      for (const chapter of readChapters) {
        if (chaptersImported >= MAX_CHAPTERS) {
          result.errors.push({
            mangaId: bookmark.mangaId,
            message: `Chapter import limit (${MAX_CHAPTERS}) reached; remaining chapters skipped.`,
          });
          break;
        }
        chaptersToImport.push(chapter);
        chaptersImported += 1;
      }

      if (chaptersToImport.length > 0) {
        await upsertSyncedReadingProgressBatch(
          supabase,
          user.id,
          bookmark,
          chaptersToImport,
        );
        result.chaptersMarkedRead += chaptersToImport.length;
      }

      result.seriesProcessed += 1;
    } catch (error) {
      result.errors.push({
        mangaId: bookmark.mangaId,
        message:
          error instanceof Error ? error.message : "Could not import this series.",
      });
    }
  });

  revalidatePath("/library");
  revalidatePath("/account");
  revalidatePath("/");

  return result;
}
