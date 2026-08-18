import { MangaCard } from "./manga-card";
import type { MangaProviderType } from "@/types";
import { cn } from "@/lib/utils";

interface MangaGridItem {
  id: string;
  provider: MangaProviderType;
  title: string;
  coverUrl: string | null;
  subtitle?: string;
  href?: string;
  hasNewChapter?: boolean;
}

interface MangaGridProps {
  items: MangaGridItem[];
  variant?: "grid" | "carousel";
  emptyMessage?: string;
}

export function MangaGrid({
  items,
  variant = "grid",
  emptyMessage = "Nothing here yet — start reading.",
}: MangaGridProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  if (variant === "carousel") {
    return (
      <div className="cover-carousel -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:snap-none lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <MangaCard
            key={`${item.provider}-${item.id}`}
            {...item}
            className="w-[140px] shrink-0 snap-start md:w-auto"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5",
      )}
    >
      {items.map((item) => (
        <MangaCard key={`${item.provider}-${item.id}`} {...item} />
      ))}
    </div>
  );
}
