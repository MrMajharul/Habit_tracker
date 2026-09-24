export const APP_NAME = "NoorPath";
export const APP_DESCRIPTION =
  "Plan your day around Salah, build better habits, and make time for what matters.";

export const isDevAuthBypass =
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project"),
);
