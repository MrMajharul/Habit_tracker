import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam) {
    const desc = encodeURIComponent(errorDescription || errorParam);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&error_description=${desc}`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const metadata = user.user_metadata || {};
      const fullName =
        metadata.full_name ||
        metadata.name ||
        user.email?.split("@")[0] ||
        "User";
      const avatarUrl = metadata.avatar_url || metadata.picture || null;

      // Ensure profile exists in public.profiles for direct Google OAuth signups
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any).upsert(
        {
          id: user.id,
          email: user.email,
          name: fullName,
          avatar_url: avatarUrl,
        },
        { onConflict: "id" }
      );

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
