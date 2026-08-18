import { MangaCard } from "./manga-card";
import type { MangaProviderType } from "@/types";

interface MangaGridItem {
  id: string;
  provider: MangaProviderType;
  title: string;
  coverUrl: string | null;
  subtitle?: string;
  href?: string;
}

export function MangaGrid({ items }: { items: MangaGridItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nothing here yet — start reading.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((item) => (
        <MangaCard key={`${item.provider}-${item.id}`} {...item} />
      ))}
    </div>
  );
}
