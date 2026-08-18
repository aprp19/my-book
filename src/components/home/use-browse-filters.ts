"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  browseHref,
  DEFAULT_BROWSE_FILTERS,
  setBrowseFilterValue,
  type BrowseFilters,
} from "@/lib/browse/filters";

const SEARCH_DEBOUNCE_MS = 300;

export function useBrowseFilters(initialFilters?: BrowseFilters) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<BrowseFilters>(initialFilters ?? DEFAULT_BROWSE_FILTERS);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFilters(initialFilters ?? DEFAULT_BROWSE_FILTERS);
  }, [initialFilters]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const applyBrowse = useCallback(
    (next: BrowseFilters) => {
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
    },
    [pathname, router],
  );

  const updateFilter = useCallback(
    <K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K] | undefined) => {
      setFilters((prev) => {
        const next = setBrowseFilterValue(prev, key, value);
        applyBrowse(next);
        return next;
      });
    },
    [applyBrowse],
  );

  const updateFilters = useCallback(
    (updater: (prev: BrowseFilters) => BrowseFilters) => {
      setFilters((prev) => {
        const next = updater(prev);
        applyBrowse(next);
        return next;
      });
    },
    [applyBrowse],
  );

  const updateSearchQuery = useCallback(
    (value: string | undefined, options?: { debounce?: boolean }) => {
      setFilters((prev) => {
        const next = setBrowseFilterValue(prev, "q", value);
        if (pathname !== "/browse") return next;

        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (options?.debounce) {
          searchDebounceRef.current = setTimeout(() => applyBrowse(next), SEARCH_DEBOUNCE_MS);
        } else {
          applyBrowse(next);
        }
        return next;
      });
    },
    [applyBrowse, pathname],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_BROWSE_FILTERS);
    applyBrowse(DEFAULT_BROWSE_FILTERS);
  }, [applyBrowse]);

  const submitBrowse = useCallback(() => {
    applyBrowse(filters);
  }, [applyBrowse, filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    updateFilters,
    updateSearchQuery,
    resetFilters,
    submitBrowse,
    applyBrowse,
  };
}
