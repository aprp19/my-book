"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { syncFromMgeko, type MgekoSyncResult } from "@/lib/actions/mgeko-sync";
import { queryKeys } from "@/lib/queries/keys";

const MGEKO_BOOKMARK_URL = "https://www.mgeko.cc/portal/bookmark/";

export function MgekoImportSection() {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState("");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<MgekoSyncResult | null>(null);
  const [errorsExpanded, setErrorsExpanded] = useState(false);
  const [syncPending, startSyncTransition] = useTransition();

  function handleSync() {
    setSyncError(null);
    setSyncResult(null);
    setErrorsExpanded(false);

    const value = sessionId.trim();
    if (!value) {
      setSyncError("Paste your mgeko sessionid cookie value.");
      return;
    }

    startSyncTransition(async () => {
      try {
        const result = await syncFromMgeko(value);
        setSessionId("");
        setSyncResult(result);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.favorites() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.continueReading() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.recentChapters() }),
        ]);
      } catch (e) {
        setSyncError(e instanceof Error ? e.message : "Sync failed.");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <RefreshCw className="size-5 shrink-0 text-primary" aria-hidden="true" />
          Import from Mgeko
        </h2>
        <p className="text-sm text-muted-foreground">
          One-time import of bookmarks and read chapters from your mgeko account.
          Your session ID is used only for this sync and is never stored.
        </p>
      </div>

      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
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
        {syncPending ? "Syncing bookmarks and read chapters…" : "Sync now"}
      </Button>
    </div>
  );
}
