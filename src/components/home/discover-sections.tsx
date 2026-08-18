import { Separator } from "@/components/ui/separator";
import type { BrowsePages } from "@/lib/data/browse-shared";
import { DiscoverFeed } from "./discover-feed";

interface DiscoverSectionsProps {
  pages: BrowsePages;
}

export function DiscoverSections({ pages }: DiscoverSectionsProps) {
  return (
    <div className="space-y-10">
      <DiscoverFeed
        feed="recently-added"
        title="Recently Added"
        page={pages["recently-added"]}
        pages={pages}
      />

      <Separator />

      <DiscoverFeed
        feed="latest-updates"
        title="Latest Updates"
        page={pages["latest-updates"]}
        pages={pages}
      />

      <Separator />

      <DiscoverFeed feed="popular" title="Popular" page={pages.popular} pages={pages} />
    </div>
  );
}
