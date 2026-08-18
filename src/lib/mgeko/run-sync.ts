import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MgekoAuthError } from "@/lib/providers/mgeko-auth-fetch";
import {
  parseMgekoBookmarkExport,
  resolveMgekoExportBookmarks,
} from "@/lib/providers/mgeko-bookmark-export";
import {
  fetchMgekoBookmarks,
  fetchMgekoReadChapters,
  type MgekoBookmark,
} from "@/lib/providers/mgeko-sync";

export const MAX_SERIES = 500;
export const MAX_CHAPTERS = 5000;
export const CONCURRENCY = 4;
export const SESSION_ID_PATTERN = /^[\w-]{16,128}$/;

export interface MgekoSyncResult {
  favoritesImported: number;
  chaptersMarkedRead: number;
  seriesProcessed: number;
  errors: { mangaId: string; message: string }[];
}

export type MgekoSyncPhase =
  | "fetching_bookmarks"
  | "resolving_titles"
  | "clearing"
  | "importing"
  | "done";

export interface MgekoSyncProgress {
  phase: MgekoSyncPhase;
  current: number;
  total: number;
  label?: string;
}

export interface RunMgekoSyncInput {
  sessionId: string;
  bookmarkExportText?: string;
}

export interface RunMgekoSyncContext {
  supabase: SupabaseClient;
  userId: string;
}

function validateSessionId(sessionId: string): string {
  const trimmed = sessionId.trim();
  if (!trimmed || !SESSION_ID_PATTERN.test(trimmed)) {
    throw new Error("Enter a valid mgeko sessionid cookie value.");
  }
  return trimmed;
}

async function clearMgekoSyncedData(
  supabase: SupabaseClient,
  userId: string,
) {
  const { error: progressError } = await supabase
    .from("reading_progress")
    .delete()
    .eq("user_id", userId)
    .eq("provider", "mgeko");
  if (progressError) throw progressError;

  const { error: favoritesError } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("provider", "mgeko");
  if (favoritesError) throw favoritesError;
}

async function upsertSyncedFavorite(
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
  userId: string,
  bookmark: MgekoBookmark,
  chapters: { chapterId: string; chapterNumber: string | null }[],
) {
  if (chapters.length === 0) return;

  const rows = chapters.map((chapter) => ({
    user_id: userId,
    provider: "mgeko" as const,
    external_manga_id: bookmark.mangaId,
    external_chapter_id: chapter.chapterId,
    chapter_number: chapter.chapterNumber,
    manga_title: bookmark.title,
    page: 0,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("reading_progress")
    .upsert(rows, { onConflict: "user_id,provider,external_chapter_id" });
  if (error) throw error;
}

async function mapPoolSequentialProgress<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>,
  onItemComplete?: (completed: number, total: number, item: T) => void,
) {
  let index = 0;
  let completed = 0;
  const total = items.length;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      const item = items[current];
      await fn(item, current);
      completed += 1;
      onItemComplete?.(completed, total, item);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
}

export async function runMgekoSync(
  ctx: RunMgekoSyncContext,
  input: RunMgekoSyncInput,
  onProgress?: (progress: MgekoSyncProgress) => void,
): Promise<MgekoSyncResult> {
  const sessionId = validateSessionId(input.sessionId);
  const exportText = input.bookmarkExportText?.trim();

  const result: MgekoSyncResult = {
    favoritesImported: 0,
    chaptersMarkedRead: 0,
    seriesProcessed: 0,
    errors: [],
  };

  let bookmarks: MgekoBookmark[];

  if (exportText) {
    onProgress?.({ phase: "resolving_titles", current: 0, total: 1 });

    const entries = parseMgekoBookmarkExport(exportText);
    const resolved = await resolveMgekoExportBookmarks(
      entries,
      (current, total, label) => {
        onProgress?.({
          phase: "resolving_titles",
          current,
          total,
          label,
        });
      },
    );

    result.errors.push(...resolved.errors);
    bookmarks = resolved.bookmarks;
  } else {
    onProgress?.({ phase: "fetching_bookmarks", current: 0, total: 1 });

    try {
      bookmarks = await fetchMgekoBookmarks(sessionId);
    } catch (error) {
      if (error instanceof MgekoAuthError) {
        throw new Error(error.message);
      }
      throw error;
    }

    onProgress?.({
      phase: "fetching_bookmarks",
      current: 1,
      total: 1,
    });
  }

  const series = bookmarks.slice(0, MAX_SERIES);

  if (series.length < bookmarks.length) {
    result.errors.push({
      mangaId: "*",
      message: `Imported first ${MAX_SERIES} of ${bookmarks.length} bookmarks (limit reached).`,
    });
  }

  onProgress?.({ phase: "clearing", current: 0, total: 1 });
  await clearMgekoSyncedData(ctx.supabase, ctx.userId);
  onProgress?.({ phase: "clearing", current: 1, total: 1 });

  if (series.length === 0) {
    onProgress?.({ phase: "done", current: 0, total: 0 });
    revalidatePath("/library");
    revalidatePath("/account");
    revalidatePath("/");
    return result;
  }

  let chaptersImported = 0;

  await mapPoolSequentialProgress(
    series,
    CONCURRENCY,
    async (bookmark) => {
      try {
        await upsertSyncedFavorite(ctx.supabase, ctx.userId, bookmark);
        result.favoritesImported += 1;

        const readChapters = await fetchMgekoReadChapters(
          sessionId,
          bookmark.mangaId,
        );
        const chaptersToImport: {
          chapterId: string;
          chapterNumber: string | null;
        }[] = [];

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
            ctx.supabase,
            ctx.userId,
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
            error instanceof Error
              ? error.message
              : "Could not import this series.",
        });
      }
    },
    (completed, total, bookmark) => {
      onProgress?.({
        phase: "importing",
        current: completed,
        total,
        label: bookmark.title,
      });
    },
  );

  onProgress?.({
    phase: "done",
    current: series.length,
    total: series.length,
  });

  revalidatePath("/library");
  revalidatePath("/account");
  revalidatePath("/");

  return result;
}
