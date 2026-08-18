"use client";

import { startTransition, useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, type ReadonlyURLSearchParams } from "next/navigation";
import { Filter, ChevronDown, ChevronUp, Search, X } from "lucide-react";
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
import type {
  BrowseFilters,
  BrowseSortOption,
  BrowseStatusFilter,
  BrowseTypeFilter,
} from "@/lib/providers/types";

const SORT_OPTIONS: { value: BrowseSortOption; label: string }[] = [
  { value: "recently_added", label: "Recently Added" },
  { value: "latest", label: "Latest Update" },
  { value: "popular_daily", label: "Popular Today" },
  { value: "popular_weekly", label: "Popular This Week" },
  { value: "popular_monthly", label: "Popular This Month" },
  { value: "popular_all_time", label: "All Time Popular" },
  { value: "top_rated", label: "Top Rated" },
  { value: "title_az", label: "Title A–Z" },
  { value: "title_za", label: "Title Z–A" },
];

const STATUS_OPTIONS: { value: BrowseStatusFilter; label: string }[] = [
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "hiatus", label: "Hiatus" },
];

const TYPE_OPTIONS: { value: BrowseTypeFilter; label: string }[] = [
  { value: "manga", label: "Manga" },
  { value: "manhwa", label: "Manhwa" },
  { value: "manhua", label: "Manhua" },
  { value: "webtoon", label: "Webtoon" },
];

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Historical",
  "Horror", "Isekai", "Martial Arts", "Mystery", "Psychological", "Romance",
  "School Life", "Sci Fi", "Seinen", "Shoujo", "Shounen", "Slice Of Life",
  "Sports", "Supernatural", "Tragedy", "Webtoons",
];

export function buildBrowseParams(filters: BrowseFilters, page = 1): URLSearchParams {
  const params = new URLSearchParams();

  if (page > 1) params.set("page", String(page));
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.safeMode !== undefined) params.set("safe_mode", filters.safeMode ? "1" : "0");
  if (filters.includeGenres?.length) params.set("include_genres", filters.includeGenres.join(","));
  if (filters.excludeGenres?.length) params.set("exclude_genres", filters.excludeGenres.join(","));
  if (filters.onlyCompleted) params.set("only_completed", "1");
  if (filters.onlyTranslated) params.set("only_translated", "1");
  if (filters.hideOnBreak) params.set("hide_on_break", "1");
  if (filters.minChapters != null) params.set("min_chapters", String(filters.minChapters));
  if (filters.maxChapters != null) params.set("max_chapters", String(filters.maxChapters));
  if (filters.minRating != null) params.set("min_rating", String(filters.minRating));

  return params;
}

export function parseBrowseFilters(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
): BrowseFilters {
  const filters: BrowseFilters = {
    safeMode: searchParams.get("safe_mode") === "1",
  };

  const q = searchParams.get("q");
  if (q) filters.q = q;
  const status = searchParams.get("status");
  if (status === "ongoing" || status === "completed" || status === "hiatus") {
    filters.status = status;
  }
  const type = searchParams.get("type");
  if (type === "manga" || type === "manhwa" || type === "manhua" || type === "webtoon") {
    filters.type = type;
  }
  const sort = searchParams.get("sort");
  if (sort) filters.sort = sort as BrowseSortOption;

  const includeGenres = searchParams.get("include_genres");
  if (includeGenres) filters.includeGenres = includeGenres.split(",").filter(Boolean);
  const excludeGenres = searchParams.get("exclude_genres");
  if (excludeGenres) filters.excludeGenres = excludeGenres.split(",").filter(Boolean);

  if (searchParams.get("only_completed") === "1") filters.onlyCompleted = true;
  if (searchParams.get("only_translated") === "1") filters.onlyTranslated = true;
  if (searchParams.get("hide_on_break") === "1") filters.hideOnBreak = true;

  const minChapters = searchParams.get("min_chapters");
  if (minChapters) filters.minChapters = Number(minChapters);
  const maxChapters = searchParams.get("max_chapters");
  if (maxChapters) filters.maxChapters = Number(maxChapters);
  const minRating = searchParams.get("min_rating");
  if (minRating) filters.minRating = Number(minRating);

  return filters;
}

const DEFAULT_FILTERS: BrowseFilters = { safeMode: false };
const SEARCH_DEBOUNCE_MS = 300;

function setFilterValue<K extends keyof BrowseFilters>(
  prev: BrowseFilters,
  key: K,
  value: BrowseFilters[K] | undefined,
): BrowseFilters {
  const next = { ...prev };
  if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
    delete next[key];
  } else {
    next[key] = value;
  }
  return next;
}

function hasAdvancedFilters(filters?: BrowseFilters) {
  return Boolean(
    filters?.includeGenres?.length ||
      filters?.excludeGenres?.length ||
      filters?.onlyCompleted ||
      filters?.onlyTranslated ||
      filters?.hideOnBreak,
  );
}

function browseHref(filters: BrowseFilters) {
  const query = buildBrowseParams(filters).toString();
  return query ? `/browse?${query}` : "/browse";
}

export function BrowseSection({
  hideTitle = false,
  initialFilters,
}: {
  hideTitle?: boolean;
  initialFilters?: BrowseFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<BrowseFilters>(initialFilters ?? DEFAULT_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(() => hasAdvancedFilters(initialFilters));
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFilters(initialFilters ?? DEFAULT_FILTERS);
    setShowAdvanced((open) => open || hasAdvancedFilters(initialFilters));
  }, [initialFilters]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  function applyBrowse(next: BrowseFilters) {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    const href = browseHref(next);
    if (pathname === "/browse" && href === `${pathname}${window.location.search}`) {
      return;
    }

    startTransition(() => {
      if (pathname === "/browse") {
        router.replace(href);
      } else {
        router.push(href);
      }
    });
  }

  function updateFilter<K extends keyof BrowseFilters>(
    key: K,
    value: BrowseFilters[K] | undefined,
  ) {
    const next = setFilterValue(filters, key, value);
    setFilters(next);
    applyBrowse(next);
  }

  function updateSearchQuery(value: string | undefined) {
    const next = setFilterValue(filters, "q", value);
    setFilters(next);

    if (pathname !== "/browse") return;

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => applyBrowse(next), SEARCH_DEBOUNCE_MS);
  }

  function toggleGenre(genre: string, list: "includeGenres" | "excludeGenres") {
    const current = filters[list] ?? [];
    const nextList = current.includes(genre)
      ? current.filter((g) => g !== genre)
      : [...current, genre];
    const next = { ...filters, [list]: nextList.length ? nextList : undefined };
    setFilters(next);
    applyBrowse(next);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    applyBrowse(DEFAULT_FILTERS);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    applyBrowse(filters);
  }

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== "safeMode" && k !== "q" && v !== undefined && (!Array.isArray(v) || v.length > 0),
  ).length;

  return (
    <section className="space-y-4">
      {!hideTitle && (
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Browse</h2>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-1 text-muted-foreground"
            >
              <X className="size-3" />
              Clear filters
            </Button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            name="q"
            className="h-9 min-w-[200px] flex-1 text-sm"
            placeholder="Search manga..."
            aria-label="Search manga"
            value={filters.q ?? ""}
            onChange={(e) => updateSearchQuery(e.target.value || undefined)}
          />
          <Button type="submit" size="sm" className="h-9">
            <Search className="size-4" />
            Search
          </Button>

          <Select
            value={filters.sort ?? "recently_added"}
            onValueChange={(v) => updateFilter("sort", v as BrowseSortOption)}
          >
            <SelectTrigger className="h-9 w-[160px] text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status ?? "any"}
            onValueChange={(v) =>
              updateFilter("status", v === "any" ? undefined : (v as BrowseStatusFilter))
            }
          >
            <SelectTrigger className="h-9 w-[130px] text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Status</SelectItem>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.type ?? "any"}
            onValueChange={(v) =>
              updateFilter("type", v === "any" ? undefined : (v as BrowseTypeFilter))
            }
          >
            <SelectTrigger className="h-9 w-[130px] text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Type</SelectItem>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant={filters.safeMode ? "default" : "outline"}
            size="sm"
            className="h-9 text-sm"
            onClick={() => updateFilter("safeMode", !filters.safeMode)}
          >
            {filters.safeMode ? "NSFW Hidden" : "Show NSFW"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 gap-1 text-sm"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <Filter className="size-3" />
            Advanced
            {showAdvanced ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </Button>
        </div>

        {showAdvanced && (
          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Include genres
              </p>
              <div className="flex flex-wrap gap-1.5">
                {GENRES.map((genre) => {
                  const included = filters.includeGenres?.includes(genre) ?? false;
                  return (
                    <Badge
                      key={genre}
                      variant={included ? "default" : "outline"}
                      className="cursor-pointer select-none text-xs"
                      onClick={() => toggleGenre(genre, "includeGenres")}
                    >
                      {genre}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Exclude genres
              </p>
              <div className="flex flex-wrap gap-1.5">
                {GENRES.map((genre) => {
                  const excluded = filters.excludeGenres?.includes(genre) ?? false;
                  return (
                    <Badge
                      key={genre}
                      variant={excluded ? "destructive" : "outline"}
                      className="cursor-pointer select-none text-xs"
                      onClick={() => toggleGenre(genre, "excludeGenres")}
                    >
                      {genre}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { key: "onlyCompleted" as const, label: "Only completed" },
                { key: "onlyTranslated" as const, label: "50+ chapters" },
                { key: "hideOnBreak" as const, label: "Hide long hiatus" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex cursor-pointer select-none items-center gap-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={filters[key] ?? false}
                    onChange={(e) => updateFilter(key, e.target.checked || undefined)}
                    className="size-4 rounded border"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
