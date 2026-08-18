"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { buildBrowseParams } from "@/lib/browse/filters";

export function HomeSearchHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = buildBrowseParams({ q: query.trim() || undefined });
    const qs = params.toString();
    router.push(qs ? `/browse?${qs}` : "/browse");
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1">
          <label htmlFor="home-search" className="sr-only">
            Search manga
          </label>
          <Input
            id="home-search"
            name="q"
            placeholder="Search manga…"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1 sm:flex-none">
            <Search className="size-4" aria-hidden="true" />
            Search
          </Button>
          <ButtonLink href="/browse" variant="outline" className="flex-1 sm:flex-none">
            Browse all
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}
