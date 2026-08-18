import { getProvider } from "@/lib/providers/registry";
import type { MgekoBookmark } from "@/lib/providers/mgeko-sync";
import { resolveCoverUrl } from "@/lib/providers/mgeko-utils";

export interface MgekoBookmarkExportEntry {
  index: number;
  title: string;
  altTitles: string[];
}

const MAX_EXPORT_BYTES = 512 * 1024;
const MAX_EXPORT_ENTRIES = 500;
const RESOLVE_CONCURRENCY = 4;

const NOISE_ALT_TITLES = new Set(
  ["updating", "preview", "预览", "new", "ongoing"].map((s) => s.toLowerCase()),
);

const ENTRY_HEADER = /^\((\d+)\)$/;
const NAME_LINE = /^NAME:\s*(.+)$/;
const OTHER_NAME_LINE = /^OTHER NAME:\s*(.*)$/;

export function normalizeTitleForMatch(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function splitAltTitles(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !NOISE_ALT_TITLES.has(part.toLowerCase()));
}

export function parseMgekoBookmarkExport(text: string): MgekoBookmarkExportEntry[] {
  if (text.length > MAX_EXPORT_BYTES) {
    throw new Error("Bookmark export file is too large (max 512 KB).");
  }

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const entries: MgekoBookmarkExportEntry[] = [];
  let currentIndex: number | null = null;
  let currentTitle: string | null = null;
  let currentAltRaw: string | null = null;

  function flushEntry() {
    if (currentIndex === null || !currentTitle) return;
    entries.push({
      index: currentIndex,
      title: currentTitle.trim(),
      altTitles: splitAltTitles(currentAltRaw ?? ""),
    });
    currentIndex = null;
    currentTitle = null;
    currentAltRaw = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") continue;

    const headerMatch = trimmed.match(ENTRY_HEADER);
    if (headerMatch) {
      flushEntry();
      currentIndex = Number.parseInt(headerMatch[1], 10);
      continue;
    }

    const nameMatch = trimmed.match(NAME_LINE);
    if (nameMatch) {
      currentTitle = nameMatch[1].trim();
      continue;
    }

    const otherMatch = trimmed.match(OTHER_NAME_LINE);
    if (otherMatch) {
      currentAltRaw = otherMatch[1];
    }
  }

  flushEntry();

  if (entries.length === 0) {
    throw new Error("No bookmarks found in export file.");
  }

  if (entries.length > MAX_EXPORT_ENTRIES) {
    throw new Error(`Bookmark export exceeds ${MAX_EXPORT_ENTRIES} entries.`);
  }

  return dedupeExportEntries(entries);
}

function dedupeExportEntries(
  entries: MgekoBookmarkExportEntry[],
): MgekoBookmarkExportEntry[] {
  const seen = new Set<string>();
  const deduped: MgekoBookmarkExportEntry[] = [];

  for (const entry of entries) {
    const key = normalizeTitleForMatch(entry.title);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(entry);
  }

  return deduped;
}

function pickExactMatch<T extends { title: string }>(
  results: T[],
  candidate: string,
): T | "ambiguous" | null {
  const normalized = normalizeTitleForMatch(candidate);
  const matches = results.filter(
    (result) => normalizeTitleForMatch(result.title) === normalized,
  );

  if (matches.length === 1) return matches[0];
  if (matches.length > 1) return "ambiguous";
  return null;
}

async function resolveExportEntry(
  entry: MgekoBookmarkExportEntry,
): Promise<
  | { bookmark: MgekoBookmark }
  | { error: { mangaId: string; message: string } }
> {
  const provider = getProvider("mgeko");
  const candidates = [entry.title, ...entry.altTitles];

  for (const candidate of candidates) {
    if (!candidate.trim()) continue;

    let results;
    try {
      results = await provider.search(candidate);
    } catch {
      continue;
    }

    const match = pickExactMatch(results, candidate);
    if (match === "ambiguous") {
      return {
        error: {
          mangaId: entry.title,
          message: `Ambiguous match for "${entry.title}".`,
        },
      };
    }

    if (match) {
      return {
        bookmark: {
          mangaId: match.id,
          title: match.title,
          coverUrl: match.coverUrl ? resolveCoverUrl(match.coverUrl) : null,
        },
      };
    }
  }

  return {
    error: {
      mangaId: entry.title,
      message: `No mgeko match for "${entry.title}".`,
    },
  };
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

export interface ResolveMgekoExportResult {
  bookmarks: MgekoBookmark[];
  errors: { mangaId: string; message: string }[];
}

export async function resolveMgekoExportBookmarks(
  entries: MgekoBookmarkExportEntry[],
  onProgress?: (current: number, total: number, label?: string) => void,
): Promise<ResolveMgekoExportResult> {
  const total = entries.length;
  const bookmarks: MgekoBookmark[] = [];
  const errors: { mangaId: string; message: string }[] = [];
  const bookmarkSlugs = new Set<string>();
  let completed = 0;

  onProgress?.(0, total);

  await mapPool(entries, RESOLVE_CONCURRENCY, async (entry) => {
    const resolved = await resolveExportEntry(entry);
    completed += 1;
    onProgress?.(completed, total, entry.title);

    if ("error" in resolved) {
      errors.push(resolved.error);
      return;
    }

    if (bookmarkSlugs.has(resolved.bookmark.mangaId)) return;
    bookmarkSlugs.add(resolved.bookmark.mangaId);
    bookmarks.push(resolved.bookmark);
  });

  return { bookmarks, errors };
}
