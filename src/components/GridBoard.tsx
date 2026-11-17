"use client";

import { useState } from "react";
import type { GridClue, PublicPuzzle, PublicPuzzleSlot } from "@/types/puzzle";
import { useGameState, type RevealedAnswer } from "@/lib/useGameState";
import SearchableDropdown, { type SearchOption } from "@/components/SearchableDropdown";
import StarMeter from "@/components/StarMeter";
import LossOptions from "@/components/LossOptions";

// stat_value is stored as a bare number ("33.5"); the unit lives in the
// category label ("Highest PPG This Season"). Pull a short unit out of it
// for display and screen-reader labels.
function statUnitFrom(categoryLabel: string | null): string | null {
  const match = categoryLabel?.match(/\b(PPG|RPG|APG|SPG|BPG|BPM|FG%|3P%|FT%)\b/i);
  return match ? match[1].toUpperCase() : null;
}

export default function GridBoard({ puzzle }: { puzzle: PublicPuzzle }) {
  const game = useGameState(puzzle.id, puzzle.max_strikes, puzzle.slots.length);
  const unit = statUnitFrom(puzzle.category_label);

  async function revealAll() {
    await Promise.all(
      puzzle.slots
        .filter((slot) => !game.solved[slot.slot_index])
        .map((slot) => game.revealSlot(slot.slot_index))
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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

      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
        {puzzle.slots.map((slot) => (
          <GridCard
            key={slot.id}
            slot={slot}
            unit={unit}
            answer={game.solved[slot.slot_index]}
            wasRevealed={!!game.revealed[slot.slot_index]}
            isWrongFlash={game.wrongFlash === slot.slot_index}
            disabled={game.gameOver && !game.practiceMode}
            onGuess={(opt) => game.submitGuess(slot.slot_index, opt.id)}
          />
        ))}
      </ol>

      {game.gameOver && !game.isComplete && (
        <div className="mt-6">
          <LossOptions
            onReveal={revealAll}
            onKeepTrying={game.enablePracticeMode}
            practiceMode={game.practiceMode}
            label="Reveal answers"
          />
        </div>
      )}
    </div>
  );
}

function GridCard({
  slot,
  unit,
  answer,
  wasRevealed,
  isWrongFlash,
  disabled,
  onGuess,
}: {
  slot: PublicPuzzleSlot;
  unit: string | null;
  answer: RevealedAnswer | undefined;
  wasRevealed: boolean;
  isWrongFlash: boolean;
  disabled: boolean;
  onGuess: (opt: SearchOption) => void;
}) {
  const clue = slot.clue_data as Partial<GridClue>;
  const rank = slot.slot_index + 1;
  const statText = clue.stat_value ? `${clue.stat_value}${unit ? ` ${unit}` : ""}` : null;
  const flipped = !!answer;
  // A guessed answer gets the green "solved" face; one handed over via
  // "Reveal answers" after a loss gets the same layout in neutral colors.
  const solvedByPlayer = flipped && !wasRevealed;

  const faceBase =
    "relative flex flex-col items-center gap-2 rounded-lg border px-3 pb-4 pt-8 [grid-area:1/1] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";

  return (
    // focus-within raises the open dropdown above neighbouring cards, which
    // each form their own stacking context because of the 3D transform.
    <li className="relative [perspective:1000px] focus-within:z-30">
      <div
        className="grid h-full transition-transform duration-500 ease-out [transform-style:preserve-3d] motion-reduce:transition-none"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* ---------- front: unsolved ---------- */}
        <div
          className={`${faceBase} transition-colors`}
          inert={flipped}
          aria-hidden={flipped}
          style={{
            background: "var(--panel)",
            borderColor: isWrongFlash ? "var(--strike)" : "var(--line)",
            boxShadow: isWrongFlash ? "0 0 0 1px var(--strike)" : "none",
          }}
        >
          <RankBadge rank={rank} />
          {clue.team_logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clue.team_logo}
              alt={clue.team_name ?? "Team logo"}
              className="h-16 w-16 object-contain drop-shadow-md sm:h-20 sm:w-20"
            />
          )}
          <StatValue value={clue.stat_value} unit={unit} />
          <div className="mt-1 w-full">
            <SearchableDropdown
              kind="player"
              placeholder="Player…"
              ariaLabel={`Guess for rank ${rank}${statText ? `, ${statText}` : ""}`}
              disabled={disabled}
              onSelect={onGuess}
            />
          </div>
        </div>

        {/* ---------- back: solved / revealed ---------- */}
        <div
          className={faceBase}
          inert={!flipped}
          aria-hidden={!flipped}
          style={{
            transform: "rotateY(180deg)",
            background: solvedByPlayer ? "color-mix(in srgb, var(--positive) 10%, var(--panel))" : "var(--panel)",
            borderColor: solvedByPlayer ? "color-mix(in srgb, var(--positive) 55%, transparent)" : "var(--line)",
          }}
        >
          <RankBadge rank={rank} solved={solvedByPlayer} />
          {clue.team_logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clue.team_logo}
              alt={clue.team_name ?? "Team logo"}
              className="h-14 w-14 object-contain drop-shadow-md sm:h-16 sm:w-16"
            />
          )}
          <StatValue value={clue.stat_value} unit={unit} />
          {answer && (
            <div className="mt-1 flex items-center gap-2">
              <Headshot name={answer.name} url={answer.headshot_url} solved={solvedByPlayer} />
              <span className="text-left text-sm font-medium leading-tight" style={{ color: "var(--court)" }}>
                {answer.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function RankBadge({ rank, solved = false }: { rank: number; solved?: boolean }) {
  return (
    <span
      className="font-mono absolute left-2 top-2 rounded px-1.5 py-0.5 text-xs font-semibold"
      style={{
        background: solved ? "color-mix(in srgb, var(--positive) 20%, transparent)" : "var(--panel-raised)",
        color: solved ? "var(--positive)" : "var(--court-dim)",
      }}
    >
      #{rank}
    </span>
  );
}

function StatValue({ value, unit }: { value?: string; unit: string | null }) {
  if (!value) return null;
  return (
    <p className="font-mono flex items-baseline gap-1 leading-none" style={{ color: "#f4f4f5" /* zinc-100 */ }}>
      <span className="text-base font-semibold sm:text-lg">{value}</span>
      {unit && (
        <span className="text-[10px] font-medium" style={{ color: "var(--court-dim)" }}>
          {unit}
        </span>
      )}
    </p>
  );
}

function Headshot({ name, url, solved }: { name: string; url?: string | null; solved: boolean }) {
  const [failed, setFailed] = useState(false);
  const ring = solved ? "var(--positive)" : "var(--line)";

  if (url && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        onError={() => setFailed(true)}
        className="h-8 w-8 shrink-0 rounded-full border-2 object-cover"
        style={{ borderColor: ring, background: "var(--panel-raised)" }}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden
      className="font-mono flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold"
      style={{ borderColor: ring, background: "var(--panel-raised)", color: "var(--court-dim)" }}
    >
      {initials}
    </span>
  );
}
