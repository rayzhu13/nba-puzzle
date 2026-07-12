"use client";

import { useState, useCallback } from "react";
import { starsForStrikes } from "@/types/puzzle";

export interface RevealedAnswer {
  id: string;
  name: string;
  abbreviation?: string;
  logo_url?: string;
  headshot_url?: string | null;
}

/**
 * Shared strike/star bookkeeping for a single puzzle session. Both the
 * "lineup" (one shared answer) and "grid" (many independent slots) game
 * boards use this — they differ only in how many correct answers they need
 * before the puzzle counts as solved.
 */
export function useGameState(puzzleId: string, maxStrikes: 3 | 5, slotsToSolve: number) {
  const [strikesUsed, setStrikesUsed] = useState(0);
  const [solved, setSolved] = useState<Record<number, RevealedAnswer>>({});
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const stars = starsForStrikes(strikesUsed, maxStrikes);
  const solvedCount = Object.keys(solved).length;
  const isComplete = solvedCount >= slotsToSolve;

  const submitGuess = useCallback(
    async (slotIndex: number, guessId: string) => {
      if (gameOver || isComplete) return;

      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId, slotIndex, guessId }),
      });
      const data = await res.json();

      if (data.correct) {
        setSolved((prev) => ({ ...prev, [slotIndex]: data.answer }));
        return { correct: true as const };
      }

      setWrongFlash(slotIndex);
      setTimeout(() => setWrongFlash(null), 500);

     const nextStrikes = strikesUsed + 1;
      setStrikesUsed(nextStrikes);

      // max_strikes is the number of misses still allowed to continue —
      // the game only ends on the miss AFTER that (5 allowed -> ends on
      // the 6th miss, 3 allowed -> ends on the 4th), not at max_strikes itself.
      if (nextStrikes > maxStrikes) {
        setGameOver(true);
      }
      return { correct: false as const };
    },
    [gameOver, isComplete, puzzleId, strikesUsed, maxStrikes]
  );

  const revealSlot = useCallback(
    async (slotIndex: number) => {
      const res = await fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId, slotIndex }),
      });
      const data = await res.json();
      if (data.answer) {
        setSolved((prev) => ({ ...prev, [slotIndex]: data.answer }));
      }
    },
    [puzzleId]
  );

  return {
    strikesUsed,
    stars,
    solved,
    wrongFlash,
    gameOver,
    isComplete,
    submitGuess,
    revealSlot,
  };
}
