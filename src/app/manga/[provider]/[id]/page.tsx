import { notFound } from "next/navigation";
import { MangaDetail } from "@/components/manga/manga-detail";
import { isMangaProviderType } from "@/lib/providers/registry";
import { getUser } from "@/lib/supabase/server";

export default async function MangaDetailPage({
  params,
}: PageProps<"/manga/[provider]/[id]">) {
  const { provider, id } = await params;

  if (!isMangaProviderType(provider)) {
    notFound();
  }

  const user = await getUser();

  return <MangaDetail provider={provider} id={id} userId={user?.id ?? null} />;
}
