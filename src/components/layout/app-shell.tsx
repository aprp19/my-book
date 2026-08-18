import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  className?: string;
  /** Skip default page-container padding (e.g. reader full-bleed) */
  bare?: boolean;
}

export function AppShell({ children, className, bare }: AppShellProps) {
  return (
    <div className={cn(!bare && "page-container", className)}>
      {children}
    </div>
  );
}
