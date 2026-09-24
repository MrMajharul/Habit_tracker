import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { MOCK_PROFILE } from "@/services/dashboard/mock-dashboard-data";
import type { Database } from "@/types/database";
import type { UserProfile } from "@/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentUser(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || isDevAuthBypass) {
    return MOCK_PROFILE;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = data as ProfileRow | null;

  return {
    id: user.id,
    name: profile?.name ?? user.email?.split("@")[0] ?? "Muslim",
    email: user.email ?? "",
    country: profile?.country ?? undefined,
    city: profile?.city ?? undefined,
    timezone: profile?.timezone ?? "UTC",
    preferredLanguage: (profile?.preferred_language as "en" | "bn") ?? "en",
  };
}
