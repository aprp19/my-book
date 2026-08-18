import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { DiscoverSections } from "@/components/home/discover-sections";
import { BrowseSection } from "@/components/home/browse-filters";
import { HomeSections } from "@/components/history/history-section";
import { parseBrowsePages } from "@/lib/data/browse";
import { browsePrefetchOptions } from "@/lib/queries/options.server";
import { getQueryClient } from "@/lib/queries/query-client";
import { getUser } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pages = parseBrowsePages(params);
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(
      browsePrefetchOptions("recently-added", pages["recently-added"]),
    ),
    queryClient.prefetchQuery(
      browsePrefetchOptions("latest-updates", pages["latest-updates"]),
    ),
    queryClient.prefetchQuery(browsePrefetchOptions("popular", pages.popular)),
  ]);

  const user = await getUser();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <section className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Personal Manga Reader</h1>
            <p className="max-w-2xl text-muted-foreground">
              Search and browse manga & manhwa from Mgeko. Track favorites, history, and
              reading progress when signed in.
            </p>
          </div>
          <BrowseSection hideTitle />
        </section>

        <DiscoverSections pages={pages} />

        <HomeSections userId={user?.id ?? null} />
      </div>
    </HydrationBoundary>
  );
}
