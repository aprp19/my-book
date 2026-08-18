"use server";

import { createClient } from "@/lib/supabase/server";
import {
  runMgekoSync,
  type MgekoSyncResult,
} from "@/lib/mgeko/run-sync";

export type { MgekoSyncResult } from "@/lib/mgeko/run-sync";

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

export async function syncFromMgeko(input: {
  sessionId: string;
  bookmarkExportText?: string;
}): Promise<MgekoSyncResult> {
  const { supabase, user } = await requireUser();
  return runMgekoSync(
    { supabase, userId: user.id },
    {
      sessionId: input.sessionId,
      bookmarkExportText: input.bookmarkExportText,
    },
  );
}
