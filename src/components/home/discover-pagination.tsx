import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  BROWSE_PAGE_SIZE,
  buildBrowsePageUrl,
  type BrowsePages,
} from "@/lib/data/browse-shared";
import type { BrowseFeed } from "@/lib/providers/types";

interface DiscoverPaginationProps {
  feed: BrowseFeed;
  page: number;
  itemCount: number;
  pages: BrowsePages;
}

export function DiscoverPagination({
  feed,
  page,
  itemCount,
  pages,
}: DiscoverPaginationProps) {
  const hasPrevious = page > 1;
  const hasNext = itemCount >= BROWSE_PAGE_SIZE;

  if (!hasPrevious && !hasNext) {
    return null;
  }

  const previousHref = hasPrevious
    ? buildBrowsePageUrl(feed, page - 1, pages)
    : undefined;
  const nextHref = hasNext ? buildBrowsePageUrl(feed, page + 1, pages) : undefined;

  return (
    <nav
      aria-label={`${feed} pagination`}
      className="flex items-center justify-center gap-2 pt-2"
    >
      {hasPrevious && previousHref ? (
        <ButtonLink variant="outline" href={previousHref}>
          <ChevronLeft className="size-4" />
          Previous
        </ButtonLink>
      ) : (
        <Button variant="outline" disabled>
          <ChevronLeft className="size-4" />
          Previous
        </Button>
      )}
      <span className="min-w-16 text-center text-sm text-muted-foreground">
        Page {page}
      </span>
      {hasNext && nextHref ? (
        <ButtonLink variant="outline" href={nextHref}>
          Next
          <ChevronRight className="size-4" />
        </ButtonLink>
      ) : (
        <Button variant="outline" disabled>
          Next
          <ChevronRight className="size-4" />
        </Button>
      )}
    </nav>
  );
}
