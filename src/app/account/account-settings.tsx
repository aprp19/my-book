"use client";

import { useState, useTransition } from "react";
import { Save, Settings, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  deleteAccount,
  updateProfile,
  type UserProfile,
} from "@/lib/actions/user-data";

interface AccountSettingsProps {
  profile: UserProfile;
}

export function AccountSettings({ profile }: AccountSettingsProps) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [profilePending, startProfileTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  const deleteMatches =
    deleteConfirm === profile.email || deleteConfirm === "DELETE";

  function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError("Passwords do not match.");
      return;
    }

    startProfileTransition(async () => {
      try {
        await updateProfile({
          displayName,
          newPassword: newPassword || undefined,
        });
        setNewPassword("");
        setConfirmPassword("");
        setProfileSuccess("Profile updated.");
      } catch (e) {
        setProfileError(e instanceof Error ? e.message : "Could not update profile.");
      }
    });
  }

  function handleDeleteAccount() {
    setDeleteError(null);
    if (!deleteMatches) return;

    startDeleteTransition(async () => {
      try {
        await deleteAccount();
      } catch (e) {
        setDeleteError(
          e instanceof Error ? e.message : "Could not delete account.",
        );
      }
    });
  }

  return (
    <AppShell className="space-y-8">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-serif font-semibold">
            <Settings className="size-6 shrink-0 text-primary" aria-hidden="true" />
            Account settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Update your display name and password.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleProfileSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} readOnly disabled />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="nickname"
              maxLength={80}
            />
          </div>

          {profile.canChangePassword ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave password fields empty to keep your current password.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Password is managed by your sign-in provider.
            </p>
          )}

          {profileError ? (
            <p className="text-sm text-destructive" role="alert">
              {profileError}
            </p>
          ) : null}
          {profileSuccess ? (
            <p className="text-sm text-primary" role="status">
              {profileSuccess}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={profilePending}>
            <Save className="size-4" aria-hidden="true" />
            {profilePending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </div>

      <div className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-destructive">
            <Trash2 className="size-5 shrink-0" aria-hidden="true" />
            Delete account
          </h2>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all saved favorites, history, and
            reading progress. This cannot be undone.
          </p>
        </div>

        <Separator className="bg-destructive/20" />

        <div className="space-y-1.5">
          <Label htmlFor="deleteConfirm">
            Type <span className="font-mono">{profile.email}</span> or{" "}
            <span className="font-mono">DELETE</span> to confirm
          </Label>
          <Input
            id="deleteConfirm"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            autoComplete="off"
          />
        </div>

        {deleteError ? (
          <p className="text-sm text-destructive" role="alert">
            {deleteError}
          </p>
        ) : null}

        <Button
          type="button"
          variant="destructive"
          className="w-full"
          disabled={!deleteMatches || deletePending}
          onClick={handleDeleteAccount}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          {deletePending ? "Deleting account…" : "Delete account"}
        </Button>
      </div>
    </AppShell>
  );
}
