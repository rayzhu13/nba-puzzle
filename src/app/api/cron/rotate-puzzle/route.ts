import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// Vercel Cron hits this on a schedule (see vercel.json). It does NOT
// generate puzzle content — you've already authored puzzles ahead of time
// via /admin and scheduled their go_live_at. This route just:
//   1. archives whatever is currently 'live'
//   2. promotes the earliest 'scheduled' puzzle whose go_live_at has passed
//
// Protected by CRON_SECRET so it can't be triggered by a random request —
// Vercel Cron automatically sends this as a Bearer token when configured.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  const nowIso = new Date().toISOString();

  const { data: nextPuzzle, error: findError } = await supabase
    .from("puzzles")
    .select("id, title")
    .eq("status", "scheduled")
    .lte("go_live_at", nowIso)
    .order("go_live_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  if (!nextPuzzle) {
    return NextResponse.json({ rotated: false, reason: "no scheduled puzzle is due yet" });
  }

  const { error: archiveError } = await supabase
    .from("puzzles")
    .update({ status: "archived" })
    .eq("status", "live");

  if (archiveError) {
    return NextResponse.json({ error: archiveError.message }, { status: 500 });
  }

  const { error: promoteError } = await supabase
    .from("puzzles")
    .update({ status: "live" })
    .eq("id", nextPuzzle.id);

  if (promoteError) {
    return NextResponse.json({ error: promoteError.message }, { status: 500 });
  }

  return NextResponse.json({ rotated: true, puzzle: nextPuzzle });
}
