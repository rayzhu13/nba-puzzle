import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Supabase's magic link doesn't log you in directly — it redirects here
// with a one-time `code` in the URL. This route exchanges that code for
// a real session (sets the auth cookies), then sends the browser on to
// wherever it was headed. Without this route, clicking the email link
// just bounces back to the login page with nothing happening.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong (expired/used link, etc.) — send back to login.
  return NextResponse.redirect(`${origin}/admin/login`);
}