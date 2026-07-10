import { requireAdmin } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/players — list all players with their team name, for the
// admin players page. POST /api/players — create a new player.
// Both admin-only: the public search route (/api/search) is the one
// regular visitors and the puzzle form hit; this route is for managing
// the underlying roster data itself.
export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("players")
    .select("id, name, headshot_url, team_id, teams ( name, abbreviation )")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { name, team_id, headshot_url } = body ?? {};

  if (!name || !team_id) {
    return NextResponse.json({ error: "name and team_id are required" }, { status: 400 });
  }

  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("players")
    .insert({ name, team_id, headshot_url: headshot_url || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
