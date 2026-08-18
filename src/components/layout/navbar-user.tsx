"use client";

import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Library, LogIn, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "@/lib/actions/user-data";

interface NavbarUserProps {
  user: User | null;
  displayName?: string | null;
}

function avatarInitial(displayName: string | null | undefined, email: string | null | undefined) {
  const source = displayName?.trim() || email?.trim() || "U";
  return source[0]?.toUpperCase() ?? "U";
}

export function NavbarUser({ user, displayName }: NavbarUserProps) {
  const router = useRouter();

  if (!user) {
    return (
      <ButtonLink size="sm" href="/login">
        <LogIn className="size-4" aria-hidden="true" />
        Login
      </ButtonLink>
    );
  }

  const initial = avatarInitial(displayName, user.email);
  const name = displayName?.trim();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Account menu"
          >
            <Avatar className="size-8">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            {name ? (
              <span className="text-sm font-medium text-foreground">{name}</span>
            ) : null}
            <span className={name ? "text-xs text-muted-foreground" : "text-sm text-foreground"}>
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/library")}>
          <Library className="size-4" aria-hidden="true" />
          My Library
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/account")}>
          <Settings className="size-4" aria-hidden="true" />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
