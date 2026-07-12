"use client";

import { useEffect } from "react";
import type { PublicPuzzle } from "@/types/puzzle";
import { useGameState } from "@/lib/useGameState";
import SearchableDropdown, { type SearchOption } from "@/components/SearchableDropdown";
import StarMeter from "@/components/StarMeter";

export default function GridBoard({ puzzle }: { puzzle: PublicPuzzle }) {
  const game = useGameState(puzzle.id, puzzle.max_strikes, puzzle.slots.length);

  useEffect(() => {
    if (game.gameOver) {
      puzzle.slots.forEach((slot) => {
        if (!game.solved[slot.slot_index]) game.revealSlot(slot.slot_index);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameOver]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <StarMeter stars={game.stars} maxStrikes={puzzle.max_strikes} strikesUsed={game.strikesUsed} />
        <span className="font-mono text-sm" style={{ color: "var(--court-dim)" }}>
          {Object.keys(game.solved).length}/{puzzle.slots.length} solved
        </span>
      </div>

      {puzzle.category_label && (
        <h2 className="font-display mb-4 text-center text-2xl" style={{ color: "var(--accent)" }}>
          {puzzle.category_label}
        </h2>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {puzzle.slots.map((slot) => {
          const clue = slot.clue_data as { team_logo?: string; stat_value?: string };
          const answer = game.solved[slot.slot_index];
          const isWrongFlash = game.wrongFlash === slot.slot_index;

          return (
            <div
              key={slot.id}
              className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors"
              style={{
                background: "var(--panel)",
                borderColor: isWrongFlash ? "var(--strike)" : "var(--line)",
              }}
            >
              {clue.stat_value && (
                <span
                  className="font-mono rounded px-2 py-0.5 text-xs font-semibold"
                  style={{ background: "var(--panel-raised)", color: "var(--accent)" }}
                >
                  {clue.stat_value}
                </span>
              )}
              {clue.team_logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={clue.team_logo} alt="" className="h-12 w-12 object-contain" />
              )}

              {answer ? (
                <div className="flex flex-col items-center gap-1 text-center">
                  {answer.headshot_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={answer.headshot_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  )}
                  <span className="text-sm font-medium" style={{ color: "var(--positive)" }}>
                    {answer.name}
                  </span>
                </div>
              ) : (
                <SearchableDropdown
                  kind="player"
                  placeholder="Player…"
                  disabled={game.gameOver}
                  onSelect={(opt: SearchOption) => game.submitGuess(slot.slot_index, opt.id)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
