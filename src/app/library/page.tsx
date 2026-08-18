import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { LibrarySections } from "@/components/history/history-section";
import { getUser } from "@/lib/supabase/server";

export default async function LibraryPage() {
  const user = await getUser();

  return (
    <AppShell className="space-y-8">
      <PageHeader
        title="My Library"
        description={
          user
            ? "Continue reading, revisit history, and open your favorites."
            : "Sign in to save favorites, history, and reading progress."
        }
      />
      <LibrarySections userId={user?.id ?? null} />
    </AppShell>
  );
}
