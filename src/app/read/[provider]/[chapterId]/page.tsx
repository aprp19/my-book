import { notFound } from "next/navigation";
import { ReaderLoader } from "@/components/reader/reader-loader";
import { isMangaProviderType } from "@/lib/providers/registry";
import { getUser } from "@/lib/supabase/server";

export default async function ReadPage({
  params,
  searchParams,
}: PageProps<"/read/[provider]/[chapterId]">) {
  const { provider, chapterId } = await params;
  const { mangaId: mangaIdParam } = await searchParams;
  const mangaId = typeof mangaIdParam === "string" ? mangaIdParam : "";

  if (!isMangaProviderType(provider) || !mangaId) {
    notFound();
  }

  const user = await getUser();

  return (
    <ReaderLoader
      provider={provider}
      chapterId={chapterId}
      mangaId={mangaId}
      userId={user?.id ?? null}
    />
  );
}
