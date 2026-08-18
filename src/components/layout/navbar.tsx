import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { createClient } from "@/lib/supabase/server";
import { NavbarUser } from "./navbar-user";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <BookOpen className="size-5" />
          <span>my-book</span>
        </Link>
        <nav className="flex items-center gap-2">
          <ButtonLink variant="ghost" size="sm" href="/browse">
            <Search className="size-4" />
            Browse
          </ButtonLink>
          <NavbarUser user={user} />
        </nav>
      </div>
    </header>
  );
}
