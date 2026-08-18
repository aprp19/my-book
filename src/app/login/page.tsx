"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/actions/user-data";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const HeaderIcon = mode === "signin" ? LogIn : UserPlus;
  const SubmitIcon = mode === "signin" ? LogIn : UserPlus;

  return (
    <AppShell className="flex min-h-[70vh] flex-col justify-center">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-serif font-semibold text-balance">
            <HeaderIcon
              className="size-6 shrink-0 text-primary"
              aria-hidden="true"
            />
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Save favorites, history, and reading progress.
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const email = String(form.get("email") ?? "");
            const password = String(form.get("password") ?? "");
            setError(null);
            startTransition(async () => {
              try {
                if (mode === "signin") {
                  await signInWithPassword(email, password);
                } else {
                  await signUpWithPassword(email, password);
                }
              } catch (e) {
                setError(e instanceof Error ? e.message : "Authentication failed.");
              }
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full gap-2" disabled={pending}>
            <SubmitIcon className="size-4" aria-hidden="true" />
            {pending
              ? mode === "signin"
                ? "Signing in…"
                : "Creating account…"
              : mode === "signin"
                ? "Sign in"
                : "Sign up"}
          </Button>
        </form>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          disabled={pending}
          onClick={() => startTransition(() => signInWithGoogle())}
        >
          <GoogleIcon className="size-4 shrink-0" />
          {pending ? "Redirecting…" : "Continue with Google"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? "No account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>

        <ButtonLink variant="ghost" className="w-full gap-2" href="/">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back home
        </ButtonLink>
      </div>
    </AppShell>
  );
}
