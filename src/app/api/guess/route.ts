import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/guess
// body: { puzzleId: string, slotIndex: number, guessId: string }
//
// Checking happens entirely server-side against puzzle_slots.answer_id —
// the browser never receives answer_id for a puzzle it hasn't solved yet.
// For "lineup" puzzle types (one team answer shared across all 5 clue
// slots) every slot carries the same answer_id, so slotIndex is only used
// to know which clue card to visually mark on the client; the equality
// check itself is identical either way.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { puzzleId, slotIndex, guessId } = body ?? {};

  if (!puzzleId || typeof slotIndex !== "number" || !guessId) {
    return NextResponse.json({ error: "puzzleId, slotIndex, guessId are required" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // Confirm the puzzle is actually live — guessing against a draft/archived
  // puzzle id should never succeed, even if someone finds the id.
  const { data: puzzle, error: puzzleError } = await supabase
    .from("puzzles")
    .select("id, status")
    .eq("id", puzzleId)
    .eq("status", "live")
    .single();

  if (puzzleError || !puzzle) {
    return NextResponse.json({ error: "puzzle not found or not live" }, { status: 404 });
  }

  const { data: slot, error: slotError } = await supabase
    .from("puzzle_slots")
    .select("id, slot_index, answer_kind, answer_id")
    .eq("puzzle_id", puzzleId)
    .eq("slot_index", slotIndex)
    .single();

  if (slotError || !slot) {
    return NextResponse.json({ error: "slot not found" }, { status: 404 });
  }

  const correct = slot.answer_id === guessId;

  // Only reveal the answer's display info when the guess was correct —
  // on a wrong guess we return nothing more than a boolean.
  if (!correct) {
    return NextResponse.json({ correct: false });
  }

  const table = slot.answer_kind === "team" ? "teams" : "players";
  const { data: answer } = await supabase
    .from(table)
    .select(slot.answer_kind === "team" ? "id, name, abbreviation, logo_url" : "id, name, headshot_url")
    .eq("id", slot.answer_id)
    .single();

  return NextResponse.json({ correct: true, answer });
}
