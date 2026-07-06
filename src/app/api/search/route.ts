import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { SearchOption } from "@/components/SearchableDropdown";

// GET /api/search?type=team|player&q=lu
// Backs the SearchableDropdown component. Read-only, uses the anon client
// since teams/players are public-read (see schema.sql RLS policies).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (type !== "team" && type !== "player") {
    return NextResponse.json({ error: "type must be 'team' or 'player'" }, { status: 400 });
  }
  if (q.length < 1) {
    return NextResponse.json([]);
  }

  const supabase = await createServerSupabase();

  if (type === "team") {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, abbreviation, logo_url")
      .ilike("search_name", `%${q}%`)
      .limit(8);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const options: SearchOption[] = (data ?? []).map((t) => ({
      id: t.id,
      label: t.name,
      sublabel: t.abbreviation,
      imageUrl: t.logo_url,
    }));
    return NextResponse.json(options);
  }

  // type === "player"
  const { data, error } = await supabase
    .from("players")
    .select("id, name, headshot_url, teams ( abbreviation )")
    .ilike("search_name", `%${q}%`)
    .limit(8);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const options: SearchOption[] = (data ?? []).map((p) => {
    const teamRel = p.teams as unknown as { abbreviation: string } | { abbreviation: string }[] | null;
    const abbreviation = Array.isArray(teamRel) ? teamRel[0]?.abbreviation : teamRel?.abbreviation;
    return {
      id: p.id,
      label: p.name,
      sublabel: abbreviation,
      imageUrl: p.headshot_url ?? undefined,
    };
  });
  return NextResponse.json(options);
}
