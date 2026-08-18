import Link from "next/link";
import { BookOpen, Compass, Library } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { createClient } from "@/lib/supabase/server";
import { NavbarUser } from "./navbar-user";

async function getProfileDisplayName(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  return data?.display_name ?? null;
}

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = user ? await getProfileDisplayName(user.id) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <BookOpen className="size-5 text-primary" aria-hidden="true" />
          <span className="font-serif text-sm sm:text-base">Personal Manga Reader</span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="Account">
          <ButtonLink variant="ghost" size="sm" href="/browse" className="hidden md:inline-flex">
            <Compass className="size-4" aria-hidden="true" />
            Browse
          </ButtonLink>
          <ButtonLink variant="ghost" size="sm" href="/library" className="hidden md:inline-flex">
            <Library className="size-4" aria-hidden="true" />
            Library
          </ButtonLink>
          <NavbarUser user={user} displayName={displayName} />
        </nav>
      </div>
    </header>
  );
}
