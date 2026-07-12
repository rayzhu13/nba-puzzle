import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import PuzzleForm, { type PuzzleFormInitial } from "@/components/admin/PuzzleForm";
import type { Puzzle, PuzzleSlot } from "@/types/puzzle";

const LINEUP_TYPES = new Set(["lineup_history", "lineup_2k", "lineup_gif"]);

function toLocalDatetimeInput(iso: string | null): string {
  if (!iso) return "";
  // datetime-local inputs want "YYYY-MM-DDTHH:mm" in local time, no timezone suffix
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditPuzzlePage({ params }: { params: Promise<{ id: string }> }) {
  const { ok } = await requireAdmin();
  if (!ok) redirect("/admin/login");

  const { id } = await params;
  const supabase = createAdminSupabase();

  const { data: puzzle } = await supabase.from("puzzles").select("*").eq("id", id).single();
  if (!puzzle) notFound();

  const { data: slots } = await supabase
    .from("puzzle_slots")
    .select("*")
    .eq("puzzle_id", id)
    .order("slot_index", { ascending: true });

  const typedPuzzle = puzzle as Puzzle;
  const typedSlots = (slots ?? []) as PuzzleSlot[];
  const isLineup = LINEUP_TYPES.has(typedPuzzle.type);

  let initial: PuzzleFormInitial;

  if (isLineup) {
    const answerTeamId = typedSlots[0]?.answer_id;
    const { data: team } = answerTeamId
      ? await supabase.from("teams").select("id, name, abbreviation, logo_url").eq("id", answerTeamId).single()
      : { data: null };

    initial = {
      id: typedPuzzle.id,
      type: typedPuzzle.type,
      title: typedPuzzle.title,
      category_label: typedPuzzle.category_label ?? "",
      max_strikes: typedPuzzle.max_strikes,
      week_number: typedPuzzle.week_number?.toString() ?? "",
      go_live_at: toLocalDatetimeInput(typedPuzzle.go_live_at),
      status: typedPuzzle.status,
      lineupAnswer: team ? { id: team.id, label: team.name, sublabel: team.abbreviation, imageUrl: team.logo_url } : null,
      lineupSlots: ["PG", "SG", "SF", "PF", "C"].map((pos) => {
        const slot = typedSlots.find((s) => (s.clue_data as { position?: string }).position === pos);
        const clue = (slot?.clue_data ?? {}) as Record<string, unknown>;
        return {
          position: pos,
          past_teams: Array.isArray(clue.past_teams) ? (clue.past_teams as string[]).join(", ") : "",
          rating_2k: clue.rating_2k != null ? String(clue.rating_2k) : "",
          gif_url: typeof clue.gif_url === "string" ? clue.gif_url : "",
        };
      }),
      gridSlots: [],
    };
  } else {
    const playerIds = typedSlots.map((s) => s.answer_id);
    const { data: players } = playerIds.length
      ? await supabase.from("players").select("id, name, headshot_url").in("id", playerIds)
      : { data: [] };

    initial = {
      id: typedPuzzle.id,
      type: typedPuzzle.type,
      title: typedPuzzle.title,
      category_label: typedPuzzle.category_label ?? "",
      max_strikes: typedPuzzle.max_strikes,
      week_number: typedPuzzle.week_number?.toString() ?? "",
      go_live_at: toLocalDatetimeInput(typedPuzzle.go_live_at),
      status: typedPuzzle.status,
      lineupAnswer: null,
      lineupSlots: [],
      gridSlots: typedSlots.map((s) => {
        const clue = s.clue_data as { team_id?: string; team_logo?: string; team_name?: string; stat_value?: string };
        const player = players?.find((p) => p.id === s.answer_id);
        return {
          team: clue.team_id
            ? { id: clue.team_id, label: clue.team_name ?? "", imageUrl: clue.team_logo }
            : null,
          stat_value: clue.stat_value ?? "",
          answer: player ? { id: player.id, label: player.name, imageUrl: player.headshot_url ?? undefined } : null,
        };
      }),
    };
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <h1 className="font-display mb-8 text-center text-3xl" style={{ color: "var(--court)" }}>
        Edit puzzle
      </h1>
      <PuzzleForm initial={initial} />
    </main>
  );
}
