import { Suspense } from "react";
import { BrowsePageClient } from "./browse-page-client";

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-muted-foreground">Loading...</div>}>
      <BrowsePageClient />
    </Suspense>
  );
}
