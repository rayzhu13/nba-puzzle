import { createServerSupabase } from "@/lib/supabase/server";
import type { Puzzle, PuzzleSlot, PublicPuzzle } from "@/types/puzzle";
import LineupBoard from "@/components/LineupBoard";
import GridBoard from "@/components/GridBoard";

const LINEUP_TYPES = new Set(["lineup_history", "lineup_2k", "lineup_gif"]);

async function getLivePuzzle(): Promise<PublicPuzzle | null> {
  const supabase = await createServerSupabase();

  const { data: puzzle } = await supabase
    .from("puzzles")
    .select("*")
    .eq("status", "live")
    .order("go_live_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!puzzle) return null;

  const { data: slots } = await supabase
    .from("puzzle_slots")
    .select("id, puzzle_id, slot_index, clue_data, answer_kind")
    .eq("puzzle_id", (puzzle as Puzzle).id)
    .order("slot_index", { ascending: true });

  return {
    ...(puzzle as Puzzle),
    slots: (slots ?? []) as Omit<PuzzleSlot, "answer_id">[],
  };
}

export default async function HomePage() {
  const puzzle = await getLivePuzzle();

  return (
    <main className="min-h-screen px-4 py-12 sm:py-16">
      <header className="mx-auto mb-10 max-w-4xl text-center">
        <p className="font-mono text-xs tracking-widest" style={{ color: "var(--accent)" }}>
          HOOPDLE
        </p>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl" style={{ color: "var(--court)" }}>
          {puzzle ? puzzle.title : "New puzzle drops soon"}
        </h1>
        {puzzle?.week_number != null && (
          <p className="font-mono mt-2 text-sm" style={{ color: "var(--court-dim)" }}>
            PUZZLE #{String(puzzle.week_number).padStart(3, "0")}
          </p>
        )}
      </header>

      {!puzzle && (
        <p className="text-center" style={{ color: "var(--court-dim)" }}>
          Nothing is live right now — check back Monday.
        </p>
      )}

      {puzzle && LINEUP_TYPES.has(puzzle.type) && <LineupBoard puzzle={puzzle} />}
      {puzzle && !LINEUP_TYPES.has(puzzle.type) && <GridBoard puzzle={puzzle} />}
    </main>
  );
}
