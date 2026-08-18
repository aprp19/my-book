"use client";

import { useState } from "react";
import { FilterSheet } from "@/components/ui/filter-sheet";
import type { BrowseFilters } from "@/lib/providers/types";
import { BrowseActiveChips } from "./browse-active-chips";
import { BrowseFilterBar } from "./browse-filter-bar";
import { BrowseFilterPanel } from "./browse-filter-panel";
import { useBrowseFilters } from "./use-browse-filters";

export {
  buildBrowseParams,
  parseBrowseFilters,
} from "@/lib/browse/filters";

interface BrowseFiltersRootProps {
  initialFilters?: BrowseFilters;
  sticky?: boolean;
  showChips?: boolean;
  showDesktopPanel?: boolean;
}

export function BrowseFiltersRoot({
  initialFilters,
  sticky = false,
  showChips = true,
  showDesktopPanel = true,
}: BrowseFiltersRootProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const {
    filters,
    updateFilter,
    updateFilters,
    updateSearchQuery,
    resetFilters,
    submitBrowse,
  } = useBrowseFilters(initialFilters);

  function toggleGenre(genre: string, list: "includeGenres" | "excludeGenres") {
    updateFilters((prev) => {
      const current = prev[list] ?? [];
      const nextList = current.includes(genre)
        ? current.filter((g) => g !== genre)
        : [...current, genre];
      return { ...prev, [list]: nextList.length ? nextList : undefined };
    });
  }

  return (
    <div className="space-y-3">
      <BrowseFilterBar
        filters={filters}
        sticky={sticky}
        onSearchChange={(v) => updateSearchQuery(v, { debounce: true })}
        onSubmit={submitBrowse}
        onUpdateFilter={updateFilter}
        onOpenFilters={() => setSheetOpen(true)}
      />

      {showChips ? (
        <BrowseActiveChips
          filters={filters}
          onUpdateFilter={updateFilter}
          onToggleGenre={toggleGenre}
          onClearAll={resetFilters}
        />
      ) : null}

      {showDesktopPanel ? (
        <details className="hidden rounded-xl border border-border bg-card/50 md:block">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium">
            Advanced filters
          </summary>
          <div className="border-t border-border px-4 pb-4 pt-2">
            <BrowseFilterPanel
              filters={filters}
              onToggleGenre={toggleGenre}
              onUpdateFilter={updateFilter}
              onClear={resetFilters}
            />
          </div>
        </details>
      ) : null}

      <FilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Filters"
      >
        <BrowseFilterPanel
          filters={filters}
          onToggleGenre={toggleGenre}
          onUpdateFilter={updateFilter}
          onClear={() => {
            resetFilters();
            setSheetOpen(false);
          }}
        />
      </FilterSheet>
    </div>
  );
}

/** @deprecated Use BrowseFiltersRoot */
export function BrowseSection({
  hideTitle: _hideTitle,
  initialFilters,
}: {
  hideTitle?: boolean;
  initialFilters?: BrowseFilters;
}) {
  return <BrowseFiltersRoot initialFilters={initialFilters} sticky={false} showDesktopPanel={false} />;
}
