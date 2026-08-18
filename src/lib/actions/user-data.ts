"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  FavoritePayload,
  MangaViewPayload,
  ReadingProgressPayload,
} from "@/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return { supabase, user };
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  revalidatePath("/");
  redirect("/");
}

export async function signUpWithPassword(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  revalidatePath("/");
  redirect("/");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });
  if (error) throw error;
  if (data.url) redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/login");
}

export async function listFavorites() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertFavorite(payload: FavoritePayload) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("favorites").upsert(
    {
      user_id: user.id,
      provider: payload.provider,
      external_manga_id: payload.externalMangaId,
      title: payload.title,
      cover_url: payload.coverUrl,
    },
    { onConflict: "user_id,provider,external_manga_id" },
  );
  if (error) throw error;
  revalidatePath("/");
}

export async function removeFavorite(provider: string, externalMangaId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", provider)
    .eq("external_manga_id", externalMangaId);
  if (error) throw error;
  revalidatePath("/");
}

export async function upsertReadingProgress(payload: ReadingProgressPayload) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("reading_progress").upsert(
    {
      user_id: user.id,
      provider: payload.provider,
      external_manga_id: payload.externalMangaId,
      external_chapter_id: payload.externalChapterId,
      chapter_number: payload.chapterNumber,
      manga_title: payload.mangaTitle ?? null,
      page: payload.page,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider,external_chapter_id" },
  );
  if (error) throw error;
}

export async function getReadingProgress(
  provider: string,
  externalChapterId: string,
) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("reading_progress")
    .select("page")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .eq("external_chapter_id", externalChapterId)
    .maybeSingle();
  return data?.page ?? 0;
}

export async function listContinueReading() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  const seen = new Set<string>();
  return (data ?? []).filter((row) => {
    const key = `${row.provider}:${row.external_manga_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}

export async function listRecentChapters() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function upsertMangaView(payload: MangaViewPayload) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("manga_views").upsert(
    {
      user_id: user.id,
      provider: payload.provider,
      external_manga_id: payload.externalMangaId,
      title: payload.title,
      cover_url: payload.coverUrl,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider,external_manga_id" },
  );
  if (error) throw error;
}

export async function listRecentMangaViews() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("manga_views")
    .select("*")
    .eq("user_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function isFavorite(provider: string, externalMangaId: string) {
  const user = await (async () => {
    const supabase = await createClient();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    return u;
  })();
  if (!user) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .eq("external_manga_id", externalMangaId)
    .maybeSingle();
  return Boolean(data);
}
