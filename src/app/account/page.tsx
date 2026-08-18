import { redirect } from "next/navigation";
import { AccountSettings } from "@/app/account/account-settings";
import { getProfile } from "@/lib/actions/user-data";
import { getUser } from "@/lib/supabase/server";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile();

  return <AccountSettings profile={profile} />;
}
