"use client";

import { createBrowserClient } from "@supabase/ssr";

// Used in client components (e.g. the searchable dropdown, admin form).
// Only ever uses the public anon key — safe to expose in the browser.
// RLS policies (see supabase/schema.sql) restrict what this client can read.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
