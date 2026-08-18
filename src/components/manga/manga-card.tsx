"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { MangaProviderType } from "@/types";

interface MangaCardProps {
  id: string;
  provider: MangaProviderType;
  title: string;
  coverUrl: string | null;
  subtitle?: string;
  href?: string;
}

/**
 * mgeko serves covers at two paths:
 *   - Direct:   https://imgsrv5.com/media/manga_covers/{filename}
 *   - Resized:  https://imgsrv5.com/avatar/288x412/media/manga_covers/{filename}
 *
 * If the direct URL 404s, retry with the resized path.
 */
function mgekoCoverFallback(originalSrc: string): string {
  // Already using the resized path — nothing to fall back to
  if (originalSrc.includes("/avatar/")) return originalSrc;

  // Swap bare imgsrv5.com path to the avatar/resized version
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
      className="absolute inset-0 size-full object-cover transition-transform group-hover:scale-[1.02]"
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
}: MangaCardProps) {
  const link = href ?? `/manga/${provider}/${encodeURIComponent(id)}`;

  return (
    <Link href={link} className="group block">
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
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-sm font-medium leading-snug">{title}</p>
              <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                {provider}
              </Badge>
            </div>
            {subtitle ? (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
