"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BROWSE_STATUS_OPTIONS,
  BROWSE_TYPE_OPTIONS,
  type BrowseFilters,
} from "@/lib/browse/filters";

interface BrowseActiveChipsProps {
  filters: BrowseFilters;
  onUpdateFilter: <K extends keyof BrowseFilters>(
    key: K,
    value: BrowseFilters[K] | undefined,
  ) => void;
  onToggleGenre: (genre: string, list: "includeGenres" | "excludeGenres") => void;
  onClearAll: () => void;
}

export function BrowseActiveChips({
  filters,
  onUpdateFilter,
  onToggleGenre,
  onClearAll,
}: BrowseActiveChipsProps) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.q) {
    chips.push({
      key: "q",
      label: `“${filters.q}”`,
      onRemove: () => onUpdateFilter("q", undefined),
    });
  }

  if (filters.status) {
    const label = BROWSE_STATUS_OPTIONS.find((o) => o.value === filters.status)?.label ?? filters.status;
    chips.push({
      key: "status",
      label,
      onRemove: () => onUpdateFilter("status", undefined),
    });
  }

  if (filters.type) {
    const label = BROWSE_TYPE_OPTIONS.find((o) => o.value === filters.type)?.label ?? filters.type;
    chips.push({
      key: "type",
      label,
      onRemove: () => onUpdateFilter("type", undefined),
    });
  }

  filters.includeGenres?.forEach((genre) => {
    chips.push({
      key: `inc-${genre}`,
      label: `+ ${genre}`,
      onRemove: () => onToggleGenre(genre, "includeGenres"),
    });
  });

  filters.excludeGenres?.forEach((genre) => {
    chips.push({
      key: `exc-${genre}`,
      label: `− ${genre}`,
      onRemove: () => onToggleGenre(genre, "excludeGenres"),
    });
  });

  if (filters.onlyCompleted) {
    chips.push({ key: "completed", label: "Completed", onRemove: () => onUpdateFilter("onlyCompleted", undefined) });
  }
  if (filters.onlyTranslated) {
    chips.push({ key: "translated", label: "50+ chapters", onRemove: () => onUpdateFilter("onlyTranslated", undefined) });
  }
  if (filters.hideOnBreak) {
    chips.push({ key: "hiatus", label: "Hide hiatus", onRemove: () => onUpdateFilter("hideOnBreak", undefined) });
  }

  if (filters.safeMode) {
    chips.push({ key: "safe", label: "NSFW hidden", onRemove: () => onUpdateFilter("safeMode", false) });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(({ key, label, onRemove }) => (
        <Badge key={key} variant="secondary" className="gap-1 pr-1 text-xs">
          {label}
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full p-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Remove ${label} filter`}
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </Badge>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={onClearAll} className="h-8 text-xs">
        Clear all
      </Button>
    </div>
  );
}
