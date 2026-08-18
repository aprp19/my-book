"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function FilterSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: FilterSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close filters"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl border border-border bg-card shadow-lg",
          "pb-[env(safe-area-inset-bottom)] overscroll-contain",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="filter-sheet-title" className="text-lg font-semibold">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close filters"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
