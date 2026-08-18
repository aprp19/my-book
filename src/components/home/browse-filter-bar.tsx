"use client";

import type { FormEvent } from "react";
import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BROWSE_SORT_OPTIONS,
  BROWSE_STATUS_OPTIONS,
  BROWSE_TYPE_OPTIONS,
  countActiveBrowseFilters,
  type BrowseFilters,
} from "@/lib/browse/filters";
import type {
  BrowseSortOption,
  BrowseStatusFilter,
  BrowseTypeFilter,
} from "@/lib/providers/types";

interface BrowseFilterBarProps {
  filters: BrowseFilters;
  onSearchChange: (value: string | undefined) => void;
  onSubmit: () => void;
  onUpdateFilter: <K extends keyof BrowseFilters>(
    key: K,
    value: BrowseFilters[K] | undefined,
  ) => void;
  onOpenFilters: () => void;
  sticky?: boolean;
}

export function BrowseFilterBar({
  filters,
  onSearchChange,
  onSubmit,
  onUpdateFilter,
  onOpenFilters,
  sticky = false,
}: BrowseFilterBarProps) {
  const advancedCount = countActiveBrowseFilters(filters);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        sticky
          ? "sticky top-14 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md"
          : "space-y-3"
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex min-w-0 flex-1 gap-2">
          <Input
            name="q"
            id="browse-search"
            className="min-w-0 flex-1"
            placeholder="Search manga…"
            aria-label="Search manga"
            autoComplete="off"
            value={filters.q ?? ""}
            onChange={(e) => onSearchChange(e.target.value || undefined)}
          />
          <Button type="submit" className="shrink-0">
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.sort ?? "recently_added"}
            onValueChange={(v) => onUpdateFilter("sort", v as BrowseSortOption)}
          >
            <SelectTrigger className="h-11 w-full min-w-[140px] sm:w-[160px] md:h-10" aria-label="Sort by">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {BROWSE_SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status ?? "any"}
            onValueChange={(v) =>
              onUpdateFilter("status", v === "any" ? undefined : (v as BrowseStatusFilter))
            }
          >
            <SelectTrigger className="h-11 w-full min-w-[120px] sm:w-[130px] md:h-10" aria-label="Status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Status</SelectItem>
              {BROWSE_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.type ?? "any"}
            onValueChange={(v) =>
              onUpdateFilter("type", v === "any" ? undefined : (v as BrowseTypeFilter))
            }
          >
            <SelectTrigger className="h-11 w-full min-w-[120px] sm:w-[130px] md:h-10" aria-label="Type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Type</SelectItem>
              {BROWSE_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant={filters.safeMode ? "default" : "outline"}
            onClick={() => onUpdateFilter("safeMode", !filters.safeMode)}
          >
            {filters.safeMode ? "NSFW Hidden" : "Show NSFW"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="gap-1.5 md:hidden"
            onClick={onOpenFilters}
          >
            <Filter className="size-4" aria-hidden="true" />
            Filters
            {advancedCount > 0 ? (
              <Badge variant="secondary" className="ml-0.5 size-5 justify-center p-0 text-[10px]">
                {advancedCount}
              </Badge>
            ) : null}
          </Button>
        </div>
      </div>
    </form>
  );
}
