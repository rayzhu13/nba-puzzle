import { createServerSupabase } from "@/lib/supabase/server";

// Comma-separated allow-list, e.g. ADMIN_EMAILS="you@example.com"
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Confirms the current request is from a logged-in Supabase user whose
 * email is on the ADMIN_EMAILS allow-list. Call this at the top of every
 * admin page and every admin API route before touching the database.
 */
export async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || !data.user.email) {
    return { ok: false as const, user: null };
  }

  const isAllowed = ADMIN_EMAILS.includes(data.user.email.toLowerCase());
  return isAllowed
    ? { ok: true as const, user: data.user }
    : { ok: false as const, user: data.user };
}
