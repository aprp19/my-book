"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { enrichFavoritesWithChapterUpdates } from "@/lib/favorites/sort-favorites";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  FavoritePayload,
  MangaViewPayload,
  ReadingProgressPayload,
} from "@/types";

export interface UserProfile {
  email: string;
  displayName: string | null;
  canChangePassword: boolean;
}

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

function canChangePassword(user: { app_metadata?: Record<string, unknown>; identities?: { provider: string }[] }) {
  const provider = user.app_metadata?.provider;
  if (provider === "google") return false;
  return user.identities?.some((identity) => identity.provider === "email") ?? false;
}

export async function getProfile(): Promise<UserProfile> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  return {
    email: user.email ?? "",
    displayName: data?.display_name ?? null,
    canChangePassword: canChangePassword(user),
  };
}

export async function updateProfile(input: {
  displayName?: string;
  newPassword?: string;
}) {
  const { supabase, user } = await requireUser();

  const displayName = input.displayName?.trim() ?? "";
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName.length > 0 ? displayName : null,
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;

  if (input.newPassword) {
    if (!canChangePassword(user)) {
      throw new Error("Password is managed by your sign-in provider.");
    }
    if (input.newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    const { error: passwordError } = await supabase.auth.updateUser({
      password: input.newPassword,
    });
    if (passwordError) throw passwordError;
  }

  revalidatePath("/account");
  revalidatePath("/");
}

export async function deleteAccount() {
  const { user } = await requireUser();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw error;

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

export async function listFavorites() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id);
  if (error) throw error;
  return enrichFavoritesWithChapterUpdates(data ?? []);
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

export async function listMangaChapterProgress(
  provider: string,
  externalMangaId: string,
) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("reading_progress")
    .select("external_chapter_id")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .eq("external_manga_id", externalMangaId);
  if (error) throw error;
  return (data ?? []).map((row) => row.external_chapter_id);
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
