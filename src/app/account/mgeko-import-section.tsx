"use client";

import { useRef, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ExternalLink, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { MgekoSyncProgress, MgekoSyncResult } from "@/lib/mgeko/run-sync";
import { queryKeys } from "@/lib/queries/keys";

const MGEKO_BOOKMARK_URL = "https://www.mgeko.cc/portal/bookmark/";
const MAX_EXPORT_BYTES = 512 * 1024;

type StreamEvent =
  | ({ type: "progress" } & MgekoSyncProgress)
  | { type: "result"; data: MgekoSyncResult }
  | { type: "error"; message: string };

function syncProgressLabel(progress: MgekoSyncProgress): string {
  const count =
    progress.total > 0 ? ` (${progress.current}/${progress.total})` : "";

  switch (progress.phase) {
    case "fetching_bookmarks":
      return "Loading bookmarks from mgeko…";
    case "resolving_titles":
      return progress.label
        ? `Matching titles…${count} — ${progress.label}`
        : `Matching titles…${count}`;
    case "clearing":
      return "Replacing library…";
    case "importing":
      return progress.label
        ? `Importing ${progress.label}…${count}`
        : `Importing series…${count}`;
    case "done":
      return "Finishing up…";
    default:
      return "Syncing…";
  }
}

async function consumeMgekoSyncStream(
  body: { sessionId: string; bookmarkExportText?: string },
  onProgress: (progress: MgekoSyncProgress) => void,
): Promise<MgekoSyncResult> {
  const response = await fetch("/api/mgeko/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = "Sync failed.";
    try {
      const json = (await response.json()) as { error?: { message?: string } };
      message = json.error?.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("Sync failed — no response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: MgekoSyncResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const event = JSON.parse(trimmed) as StreamEvent;

      if (event.type === "progress") {
        onProgress({
          phase: event.phase,
          current: event.current,
          total: event.total,
          label: event.label,
        });
      } else if (event.type === "result") {
        result = event.data;
      } else if (event.type === "error") {
        throw new Error(event.message);
      }
    }
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer.trim()) as StreamEvent;
    if (event.type === "result") {
      result = event.data;
    } else if (event.type === "error") {
      throw new Error(event.message);
    }
  }

  if (!result) {
    throw new Error("Sync ended without a result.");
  }

  return result;
}

export function MgekoImportSection() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionId, setSessionId] = useState("");
  const [bookmarkExportText, setBookmarkExportText] = useState<string | null>(
    null,
  );
  const [exportFileName, setExportFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<MgekoSyncResult | null>(null);
  const [syncProgress, setSyncProgress] = useState<MgekoSyncProgress | null>(
    null,
  );
  const [errorsExpanded, setErrorsExpanded] = useState(false);
  const [syncPending, startSyncTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    setSyncResult(null);
    const file = event.target.files?.[0];
    if (!file) {
      setBookmarkExportText(null);
      setExportFileName(null);
      return;
    }

    if (file.size > MAX_EXPORT_BYTES) {
      setFileError("Bookmark export file is too large (max 512 KB).");
      setBookmarkExportText(null);
      setExportFileName(null);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      if (!text.trim()) {
        setFileError("Bookmark export file is empty.");
        setBookmarkExportText(null);
        setExportFileName(null);
        return;
      }
      setBookmarkExportText(text);
      setExportFileName(file.name);
    };
    reader.onerror = () => {
      setFileError("Could not read bookmark export file.");
      setBookmarkExportText(null);
      setExportFileName(null);
    };
    reader.readAsText(file);
  }

  function clearExportFile() {
    setBookmarkExportText(null);
    setExportFileName(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSync() {
    setSyncError(null);
    setSyncResult(null);
    setErrorsExpanded(false);
    setSyncProgress(null);

    const value = sessionId.trim();
    if (!value) {
      setSyncError("Paste your mgeko sessionid cookie value.");
      return;
    }

    startSyncTransition(async () => {
      try {
        const result = await consumeMgekoSyncStream(
          {
            sessionId: value,
            bookmarkExportText: bookmarkExportText ?? undefined,
          },
          setSyncProgress,
        );
        setSessionId("");
        clearExportFile();
        setSyncResult(result);
        setSyncProgress(null);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.favorites() }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.continueReading(),
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.recentChapters(),
          }),
        ]);
      } catch (e) {
        setSyncProgress(null);
        setSyncError(e instanceof Error ? e.message : "Sync failed.");
      }
    });
  }

  const progressPercent =
    syncProgress && syncProgress.total > 0
      ? (syncProgress.current / syncProgress.total) * 100
      : syncProgress
        ? undefined
        : 0;

  return (
    <div className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <RefreshCw className="size-5 shrink-0 text-primary" aria-hidden="true" />
          Import from Mgeko
        </h2>
        <p className="text-sm text-muted-foreground">
          Import bookmarks and read chapters from your mgeko account. Your session
          ID is used only for this sync and is never stored.
        </p>
      </div>

      <div
        className="flex gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm"
        role="note"
      >
        <TriangleAlert
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p>
          <strong className="font-medium text-foreground">This replaces your mgeko library.</strong>{" "}
          Syncing deletes all existing mgeko favorites and read progress in this
          app, then imports fresh data from mgeko. Other providers and in-app
          reading history are not affected.
        </p>
      </div>

      <div className="space-y-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Quick sync (session only)</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Log in on{" "}
            <a
              href={MGEKO_BOOKMARK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              mgeko
            </a>
          </li>
          <li>Open DevTools → Application → Cookies → www.mgeko.cc</li>
          <li>Copy the <span className="font-mono">sessionid</span> value</li>
        </ol>

        <p className="font-medium text-foreground">Or import from export file</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            On the bookmarks page, download your{" "}
            <span className="font-mono">user_bookmarks.txt</span> export
          </li>
          <li>Upload the file below (still need sessionid for read chapters)</li>
        </ol>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mgekoBookmarkExport">Bookmark export (optional)</Label>
        <Input
          ref={fileInputRef}
          id="mgekoBookmarkExport"
          type="file"
          accept=".txt,text/plain"
          disabled={syncPending}
          onChange={handleFileChange}
        />
        {exportFileName ? (
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate">{exportFileName}</span>
            <button
              type="button"
              className="shrink-0 text-primary hover:underline"
              onClick={clearExportFile}
              disabled={syncPending}
            >
              Remove
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Leave empty to load bookmarks live from mgeko.
          </p>
        )}
        {fileError ? (
          <p className="text-xs text-destructive" role="alert">
            {fileError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mgekoSessionId">Session ID</Label>
        <Input
          id="mgekoSessionId"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Paste sessionid cookie"
          disabled={syncPending}
        />
      </div>

      {syncPending && syncProgress ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <Progress
            value={progressPercent ?? 0}
            max={100}
            aria-valuenow={progressPercent ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={syncProgressLabel(syncProgress)}
          />
          <p className="text-sm text-muted-foreground">
            {syncProgressLabel(syncProgress)}
          </p>
        </div>
      ) : null}

      {syncError ? (
        <p className="text-sm text-destructive" role="alert">
          {syncError}
        </p>
      ) : null}

      {syncResult ? (
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm" role="status">
          <p>
            {syncResult.favoritesImported} favorites ·{" "}
            {syncResult.chaptersMarkedRead} chapters marked read ·{" "}
            {syncResult.seriesProcessed} series
          </p>
          {syncResult.errors.length > 0 ? (
            <div>
              <button
                type="button"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setErrorsExpanded((open) => !open)}
                aria-expanded={errorsExpanded}
              >
                <ChevronDown
                  className={`size-4 transition-transform ${errorsExpanded ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
                {syncResult.errors.length} warning
                {syncResult.errors.length === 1 ? "" : "s"}
              </button>
              {errorsExpanded ? (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {syncResult.errors.map((err, index) => (
                    <li key={`${err.mangaId}-${index}`}>
                      <span className="font-mono">{err.mangaId}</span>: {err.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <a
            href="/library"
            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
          >
            View library
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      ) : null}

      <Button
        type="button"
        className="w-full"
        disabled={syncPending || !sessionId.trim()}
        onClick={handleSync}
      >
        <RefreshCw
          className={`size-4 ${syncPending ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        {syncPending ? "Syncing…" : "Sync now"}
      </Button>
    </div>
  );
}
