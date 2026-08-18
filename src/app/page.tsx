import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { DiscoverSections } from "@/components/home/discover-sections";
import { HomeSearchHero } from "@/components/home/home-search-hero";
import { LibraryHashRedirect } from "@/components/home/library-hash-redirect";
import { AppShell } from "@/components/layout/app-shell";
import { parseBrowsePages } from "@/lib/data/browse";
import { browsePrefetchOptions } from "@/lib/queries/options.server";
import { getQueryClient } from "@/lib/queries/query-client";

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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LibraryHashRedirect />
      <AppShell className="space-y-10">
        <section className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-serif font-semibold tracking-tight md:text-3xl">
              Personal Manga Reader
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Search and browse manga & manhwa from Mgeko.{" "}
              <a href="/library" className="text-primary underline-offset-4 hover:underline">
                Sign in to save progress in your library
              </a>
              .
            </p>
          </div>
          <HomeSearchHero />
        </section>

        <DiscoverSections pages={pages} />
      </AppShell>
    </HydrationBoundary>
  );
}
