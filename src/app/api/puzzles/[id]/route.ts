import { requireAdmin } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { ANSWER_KIND_FOR_TYPE } from "@/types/puzzle";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminSupabase();

  const { data: puzzle, error } = await supabase.from("puzzles").select("*").eq("id", id).single();
  if (error || !puzzle) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: slots } = await supabase
    .from("puzzle_slots")
    .select("*")
    .eq("puzzle_id", id)
    .order("slot_index", { ascending: true });

  return NextResponse.json({ ...puzzle, slots: slots ?? [] });
}

// PATCH — updates puzzle fields and fully replaces its slots (simplest
// correct behavior for a low-volume, manually-curated admin tool: delete
// + reinsert avoids diffing slot arrays for a handful of weekly edits).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid JSON" }, { status: 400 });

  const { type, title, category_label, max_strikes, week_number, go_live_at, status, slots } = body;
  const supabase = createAdminSupabase();

  const { error: updateError } = await supabase
    .from("puzzles")
    .update({ type, title, category_label, max_strikes, week_number, go_live_at, status })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (Array.isArray(slots)) {
    await supabase.from("puzzle_slots").delete().eq("puzzle_id", id);

    const answerKind = ANSWER_KIND_FOR_TYPE[type as keyof typeof ANSWER_KIND_FOR_TYPE];
    const slotRows = slots.map((s: { slot_index: number; clue_data: object; answer_id: string }) => ({
      puzzle_id: id,
      slot_index: s.slot_index,
      clue_data: s.clue_data,
      answer_kind: answerKind,
      answer_id: s.answer_id,
    }));

    const { error: slotsError } = await supabase.from("puzzle_slots").insert(slotRows);
    if (slotsError) return NextResponse.json({ error: slotsError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminSupabase();
  const { error } = await supabase.from("puzzles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
