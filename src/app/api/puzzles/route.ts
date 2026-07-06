import { requireAdmin } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { ANSWER_KIND_FOR_TYPE } from "@/types/puzzle";

// POST /api/puzzles — creates a puzzle plus all its slots in one call.
// Admin-only: every write route re-checks requireAdmin() itself rather
// than trusting middleware alone, since middleware only guards page
// navigation, not direct API calls.
export async function POST(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid JSON" }, { status: 400 });

  const { type, title, category_label, max_strikes, week_number, go_live_at, status, slots } = body;

  if (!type || !title || !Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json({ error: "type, title, and at least one slot are required" }, { status: 400 });
  }

  const supabase = createAdminSupabase();

  const { data: puzzle, error: puzzleError } = await supabase
    .from("puzzles")
    .insert({
      type,
      title,
      category_label: category_label ?? null,
      max_strikes: max_strikes ?? 5,
      week_number: week_number ?? null,
      go_live_at: go_live_at ?? null,
      status: status ?? "draft",
    })
    .select()
    .single();

  if (puzzleError) return NextResponse.json({ error: puzzleError.message }, { status: 500 });

  const answerKind = ANSWER_KIND_FOR_TYPE[type as keyof typeof ANSWER_KIND_FOR_TYPE];
  const slotRows = slots.map((s: { slot_index: number; clue_data: object; answer_id: string }) => ({
    puzzle_id: puzzle.id,
    slot_index: s.slot_index,
    clue_data: s.clue_data,
    answer_kind: answerKind,
    answer_id: s.answer_id,
  }));

  const { error: slotsError } = await supabase.from("puzzle_slots").insert(slotRows);
  if (slotsError) {
    // Roll back the orphaned puzzle row so retries don't pile up drafts.
    await supabase.from("puzzles").delete().eq("id", puzzle.id);
    return NextResponse.json({ error: slotsError.message }, { status: 500 });
  }

  return NextResponse.json({ puzzle }, { status: 201 });
}
