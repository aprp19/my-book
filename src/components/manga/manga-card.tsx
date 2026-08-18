"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { MangaProviderType } from "@/types";
import { cn } from "@/lib/utils";

interface MangaCardProps {
  id: string;
  provider: MangaProviderType;
  title: string;
  coverUrl: string | null;
  subtitle?: string;
  href?: string;
  className?: string;
  /** Hide provider badge on grid cards (shown on detail only) */
  showProvider?: boolean;
}

function mgekoCoverFallback(originalSrc: string): string {
  if (originalSrc.includes("/avatar/")) return originalSrc;
  return originalSrc.replace(
    "https://imgsrv5.com/",
    "https://imgsrv5.com/avatar/288x412/",
  );
}

function CoverImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [triedFallback, setTriedFallback] = useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      width={288}
      height={412}
      loading="lazy"
      className="absolute inset-0 size-full object-cover motion-safe-scale-hover group-hover:scale-[1.02]"
      onError={() => {
        if (!triedFallback) {
          const fallback = mgekoCoverFallback(imgSrc);
          if (fallback !== imgSrc) {
            setTriedFallback(true);
            setImgSrc(fallback);
          }
        }
      }}
    />
  );
}

export function MangaCard({
  id,
  provider,
  title,
  coverUrl,
  subtitle,
  href,
  className,
  showProvider = false,
}: MangaCardProps) {
  const link = href ?? `/manga/${provider}/${encodeURIComponent(id)}`;

  return (
    <Link href={link} className={cn("group block touch-manipulation", className)}>
      <Card className="overflow-hidden border-border/60 py-0 transition-colors hover:border-primary/40">
        <CardContent className="p-0">
          <div className="relative aspect-[2/3] bg-muted">
            {coverUrl ? (
              <CoverImage src={coverUrl} alt={title} />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No cover
              </div>
            )}
          </div>
          <div className="space-y-1 p-3">
            <p className="line-clamp-2 min-w-0 text-sm font-medium leading-snug">{title}</p>
            {subtitle ? (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            ) : showProvider ? (
              <p className="text-xs uppercase text-muted-foreground">{provider}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
