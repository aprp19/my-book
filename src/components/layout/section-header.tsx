import Link from "next/link";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  action?: ReactNode;
}

export function SectionHeader({
  title,
  seeAllHref,
  seeAllLabel = "See all",
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      {action}
      {!action && seeAllHref ? (
        <Link
          href={seeAllHref}
          className="text-sm font-medium text-primary hover:underline"
        >
          {seeAllLabel}
        </Link>
      ) : null}
    </div>
  );
}
