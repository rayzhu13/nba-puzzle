import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/reveal — body: { puzzleId: string, slotIndex: number }
// Called only after the player has exhausted max_strikes for a slot/puzzle.
// Distinct from /api/guess so the client can't reuse a "reveal" call as a
// free unlimited-guess loophole — this route always costs the player the
// puzzle being marked as failed on the client.
export async function POST(req: NextRequest) {
  const { puzzleId, slotIndex } = await req.json().catch(() => ({}));
  if (!puzzleId || typeof slotIndex !== "number") {
    return NextResponse.json({ error: "puzzleId and slotIndex are required" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  const { data: slot, error } = await supabase
    .from("puzzle_slots")
    .select("answer_kind, answer_id")
    .eq("puzzle_id", puzzleId)
    .eq("slot_index", slotIndex)
    .single();

  if (error || !slot) {
    return NextResponse.json({ error: "slot not found" }, { status: 404 });
  }

  const table = slot.answer_kind === "team" ? "teams" : "players";
  const { data: answer } = await supabase
    .from(table)
    .select(slot.answer_kind === "team" ? "id, name, abbreviation, logo_url" : "id, name, headshot_url")
    .eq("id", slot.answer_id)
    .single();

  return NextResponse.json({ answer });
}
