"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  isSignedIn: boolean;
}

export function BottomNav({ isSignedIn }: BottomNavProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/read/")) {
    return null;
  }

  const accountHref = isSignedIn ? "/account" : "/login";
  const accountActive =
    pathname.startsWith("/account") || (!isSignedIn && pathname.startsWith("/login"));

  const items = [
    { href: "/", label: "Home", icon: BookOpen, active: pathname === "/" },
    { href: "/browse", label: "Browse", icon: Compass, active: pathname.startsWith("/browse") },
    { href: "/library", label: "Library", icon: Library, active: pathname.startsWith("/library") },
    { href: accountHref, label: "Account", icon: User, active: accountActive },
  ] as const;

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ href, label, icon: Icon, active }) => (
          <li key={href} className="flex-1">
            <Link
              href={href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs transition-colors touch-manipulation",
                active
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
