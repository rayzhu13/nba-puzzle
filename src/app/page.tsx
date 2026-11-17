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

// "Week 12 · 2025–26 Season" — built from whichever parts the puzzle has.
function formatEditionLabel(puzzle: PublicPuzzle | null): string | null {
  if (!puzzle) return null;
  const parts: string[] = [];
  if (puzzle.week_number != null) parts.push(`Week ${puzzle.week_number}`);
  if (puzzle.season) parts.push(`${puzzle.season.replace("-", "–")} Season`);
  return parts.length ? parts.join(" · ") : null;
}

export default async function HomePage() {
  const puzzle = await getLivePuzzle();
  const editionLabel = formatEditionLabel(puzzle);

  return (
    <main className="min-h-screen px-4 py-12 sm:py-16">
      <header className="mx-auto mb-10 max-w-4xl text-center">
        {editionLabel && (
          <p
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: "var(--court-dim)" }}
          >
            {editionLabel}
          </p>
        )}
        <h1
          className="font-display mt-1 text-6xl leading-none sm:text-7xl md:text-8xl"
          style={{ color: "var(--accent)" }}
        >
          HOOPDLE
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg" style={{ color: "var(--court)" }}>
          {puzzle ? puzzle.title : "New puzzle drops soon"}
        </p>
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
