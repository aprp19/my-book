"use client";

import { useState, useTransition } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/actions/user-data";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <AppShell className="flex min-h-[70vh] flex-col justify-center">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-serif font-semibold">
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
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? mode === "signin"
                ? "Signing in…"
                : "Creating account…"
              : mode === "signin"
                ? "Sign in"
                : "Sign up"}
          </Button>
        </form>

        <Button
          variant="outline"
          className="w-full"
          disabled={pending}
          onClick={() => startTransition(() => signInWithGoogle())}
        >
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

        <ButtonLink variant="ghost" className="w-full" href="/">
          Back home
        </ButtonLink>
      </div>
    </AppShell>
  );
}
