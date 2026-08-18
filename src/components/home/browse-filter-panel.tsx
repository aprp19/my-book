"use client";

import {
  BROWSE_GENRES,
  type BrowseFilters,
} from "@/lib/browse/filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BrowseFilterPanelProps {
  filters: BrowseFilters;
  onToggleGenre: (genre: string, list: "includeGenres" | "excludeGenres") => void;
  onUpdateFilter: <K extends keyof BrowseFilters>(
    key: K,
    value: BrowseFilters[K] | undefined,
  ) => void;
  onClear?: () => void;
  className?: string;
}

export function BrowseFilterPanel({
  filters,
  onToggleGenre,
  onUpdateFilter,
  onClear,
  className,
}: BrowseFilterPanelProps) {
  return (
    <div className={cn("space-y-5", className)}>
      {onClear ? (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Clear all filters
          </Button>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Include genres
        </p>
        <div className="chip-row">
          {BROWSE_GENRES.map((genre) => {
            const included = filters.includeGenres?.includes(genre) ?? false;
            return (
              <button
                key={genre}
                type="button"
                aria-pressed={included}
                onClick={() => onToggleGenre(genre, "includeGenres")}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Badge variant={included ? "default" : "outline"} className="text-xs">
                  {genre}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Exclude genres
        </p>
        <div className="chip-row">
          {BROWSE_GENRES.map((genre) => {
            const excluded = filters.excludeGenres?.includes(genre) ?? false;
            return (
              <button
                key={genre}
                type="button"
                aria-pressed={excluded}
                onClick={() => onToggleGenre(genre, "excludeGenres")}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Badge variant={excluded ? "destructive" : "outline"} className="text-xs">
                  {genre}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {[
          { key: "onlyCompleted" as const, label: "Only completed" },
          { key: "onlyTranslated" as const, label: "50+ chapters" },
          { key: "hideOnBreak" as const, label: "Hide long hiatus" },
        ].map(({ key, label }) => (
          <label
            key={key}
            className="flex min-h-11 cursor-pointer select-none items-center gap-3 text-sm"
          >
            <input
              type="checkbox"
              checked={filters[key] ?? false}
              onChange={(e) => onUpdateFilter(key, e.target.checked || undefined)}
              className="size-5 rounded border accent-primary"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
