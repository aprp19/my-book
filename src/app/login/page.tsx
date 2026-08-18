"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
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
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
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
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Password" required minLength={6} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <Button
          variant="outline"
          className="w-full"
          disabled={pending}
          onClick={() => startTransition(() => signInWithGoogle())}
        >
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? "No account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="text-foreground underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>

        <ButtonLink variant="ghost" className="w-full" href="/">
          Back home
        </ButtonLink>
      </div>
    </div>
  );
}
