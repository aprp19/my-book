import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MangaGridSkeleton({ variant = "grid" }: { variant?: "grid" | "carousel" }) {
  if (variant === "carousel") {
    return (
      <div className="cover-carousel -mx-4 flex gap-3 overflow-hidden px-4 md:grid md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="aspect-[2/3] w-[140px] shrink-0 rounded-xl md:w-full"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[2/3] w-full rounded-xl" />
      ))}
    </div>
  );
}
