"use client";

import { useEffect } from "react";
import type { PublicPuzzle } from "@/types/puzzle";
import { useGameState } from "@/lib/useGameState";
import SearchableDropdown, { type SearchOption } from "@/components/SearchableDropdown";
import StarMeter from "@/components/StarMeter";
import CourtBackground from "@/components/CourtBackground";

// Positions laid out to mirror a half-court view: PG top, wings on either
// side, PF/C along the baseline — matches the reference screenshot.
const POSITION_LAYOUT: Record<string, string> = {
  PG: "col-start-2 row-start-1 justify-self-center",
  SG: "col-start-1 row-start-2 justify-self-start",
  SF: "col-start-3 row-start-2 justify-self-end",
  PF: "col-start-1 row-start-3 justify-self-start",
  C: "col-start-3 row-start-3 justify-self-end",
};

export default function LineupBoard({ puzzle }: { puzzle: PublicPuzzle }) {
  const game = useGameState(puzzle.id, puzzle.max_strikes, 1);
  const solvedAnswer = game.solved[0];

  useEffect(() => {
    if (game.gameOver && !solvedAnswer) {
      game.revealSlot(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameOver]);

  function handleSelect(option: SearchOption) {
    game.submitGuess(0, option.id);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <StarMeter stars={game.stars} maxStrikes={puzzle.max_strikes} strikesUsed={game.strikesUsed} />
      </div>

      <div
        className="relative aspect-square w-full overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--line)" }}
      >
        <CourtBackground />
        <div className="relative z-10 grid h-full w-full grid-cols-3 grid-rows-3 gap-4 p-8">
          {puzzle.slots.map((slot) => {
            const clue = slot.clue_data as { position: keyof typeof POSITION_LAYOUT };
            const layoutClass = POSITION_LAYOUT[clue.position] ?? "";
            return (
              <div key={slot.id} className={`flex flex-col items-center gap-2 ${layoutClass}`}>
                <span className="font-display text-sm" style={{ color: "var(--court-dim)" }}>
                  {clue.position}
                </span>
                <ClueContent puzzleType={puzzle.type} clueData={slot.clue_data} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {solvedAnswer ? (
          <ResultBanner solved={!game.gameOver || game.isComplete} answer={solvedAnswer} />
        ) : (
          <SearchableDropdown kind="team" onSelect={handleSelect} disabled={game.gameOver} />
        )}
      </div>
    </div>
  );
}

function ClueContent({
  puzzleType,
  clueData,
}: {
  puzzleType: PublicPuzzle["type"];
  clueData: object;
}) {
  const clue = clueData as Record<string, unknown>;

  if (puzzleType === "lineup_history") {
    const teams = (clue.past_teams as string[]) ?? [];
    return (
      <div className="flex flex-wrap justify-center gap-1">
        {teams.map((t, i) => (
          <span
            key={i}
            className="rounded px-2 py-1 text-xs font-medium"
            style={{ background: "var(--panel-raised)", color: "var(--court)" }}
          >
            {t}
          </span>
        ))}
      </div>
    );
  }

  if (puzzleType === "lineup_2k") {
    return (
      <div
        className="rounded-full px-4 py-2 font-mono text-lg font-semibold"
        style={{ background: "var(--panel-raised)", color: "var(--accent)" }}
      >
        {String(clue.rating_2k)}
      </div>
    );
  }

  if (puzzleType === "lineup_gif") {
    const url = clue.gif_url as string;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="Player clue" className="h-20 w-20 rounded-md object-cover" />
    );
  }

  return null;
}

function ResultBanner({
  solved,
  answer,
}: {
  solved: boolean;
  answer: { name: string; abbreviation?: string; logo_url?: string };
}) {
  return (
    <div
      className="flex items-center justify-center gap-3 rounded-md border px-4 py-3"
      style={{
        borderColor: solved ? "var(--positive)" : "var(--strike)",
        background: solved ? "rgba(51,193,122,0.08)" : "rgba(229,56,77,0.08)",
      }}
    >
      {answer.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={answer.logo_url} alt="" className="h-8 w-8" />
      )}
      <span className="font-display text-lg" style={{ color: "var(--court)" }}>
        {solved ? "Correct — " : "Answer — "}
        {answer.name}
      </span>
    </div>
  );
}
