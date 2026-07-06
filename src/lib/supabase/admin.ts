import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security entirely.
// NEVER import this into a client component or expose SUPABASE_SERVICE_ROLE_KEY
// to the browser. Only use inside:
//   - API routes under src/app/api/** that check isAdminRequest() first
//   - the cron route (protected by CRON_SECRET)
export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
