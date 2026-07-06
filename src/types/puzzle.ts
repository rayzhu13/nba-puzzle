// Core domain types shared by the admin dashboard, public game UI,
// and API routes. Keep this file framework-agnostic (no React/Next imports).

export type PuzzleType =
  | "lineup_history"
  | "lineup_2k"
  | "lineup_gif"
  | "grid_category"
  | "grid_bpm";

export type PuzzleStatus = "draft" | "scheduled" | "live" | "archived";
export type AnswerKind = "team" | "player";

export const PUZZLE_TYPE_LABELS: Record<PuzzleType, string> = {
  lineup_history: "Guess the Team — Career Path Lineup",
  lineup_2k: "Guess the Team — 2K Ratings Lineup",
  lineup_gif: "Guess the Team — Player GIF Lineup",
  grid_category: "Grid — Stat Category (one player per team)",
  grid_bpm: "Grid — Highest Box Plus/Minus",
};

// Every puzzle type answer is a team, except the grid types which ask
// for individual players.
export const ANSWER_KIND_FOR_TYPE: Record<PuzzleType, AnswerKind> = {
  lineup_history: "team",
  lineup_2k: "team",
  lineup_gif: "team",
  grid_category: "player",
  grid_bpm: "player",
};

// ---------- clue payload shapes ----------
// Stored as jsonb in puzzle_slots.clue_data. Shape depends on puzzle type.

export interface LineupHistoryClue {
  position: "PG" | "SG" | "SF" | "PF" | "C";
  past_teams: string[]; // e.g. ["Timberwolves", "Nuggets"] — teams this player has played for, excluding the answer
}

export interface Lineup2kClue {
  position: "PG" | "SG" | "SF" | "PF" | "C";
  rating_2k: number; // e.g. 91
}

export interface LineupGifClue {
  position: "PG" | "SG" | "SF" | "PF" | "C";
  gif_url: string;
}

export interface GridClue {
  team_logo: string; // logo URL shown for this slot
  team_name?: string; // used in admin form only, not required for render
  stat_value?: string; // optional display value revealed after a correct/final guess, e.g. "34.2 PPG"
}

export type ClueData = LineupHistoryClue | Lineup2kClue | LineupGifClue | GridClue;

// ---------- DB row shapes ----------

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo_url: string;
}

export interface Player {
  id: string;
  name: string;
  team_id: string | null;
  headshot_url: string | null;
}

export interface PuzzleSlot {
  id: string;
  puzzle_id: string;
  slot_index: number;
  clue_data: ClueData;
  answer_kind: AnswerKind;
  answer_id: string;
}

export interface Puzzle {
  id: string;
  type: PuzzleType;
  title: string;
  category_label: string | null;
  status: PuzzleStatus;
  week_number: number | null;
  go_live_at: string | null;
  max_strikes: 3 | 5;
  created_at: string;
  updated_at: string;
}

export interface PuzzleWithSlots extends Puzzle {
  slots: PuzzleSlot[];
}

// The shape sent to the PUBLIC client — answer_id is stripped out so
// the answer never ships in the initial page payload.
export type PublicPuzzleSlot = Omit<PuzzleSlot, "answer_id">;
export interface PublicPuzzle extends Omit<Puzzle, never> {
  slots: PublicPuzzleSlot[];
}

// ---------- scoring ----------
// Stars start at 5 and step down evenly across max_strikes wrong guesses.
export function starsForStrikes(strikesUsed: number, maxStrikes: 3 | 5): number {
  const penaltyPerStrike = 5 / maxStrikes;
  const stars = 5 - strikesUsed * penaltyPerStrike;
  return Math.max(0, Math.round(stars * 10) / 10);
}
