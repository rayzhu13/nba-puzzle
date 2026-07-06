"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import SearchableDropdown, { type SearchOption } from "@/components/SearchableDropdown";
import { PUZZLE_TYPE_LABELS, type PuzzleType, type PuzzleStatus } from "@/types/puzzle";

const LINEUP_TYPES: PuzzleType[] = ["lineup_history", "lineup_2k", "lineup_gif"];
const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

interface LineupSlotDraft {
  position: string;
  past_teams: string; // comma-separated in the form, split on save
  rating_2k: string;
  gif_url: string;
}

interface GridSlotDraft {
  team_logo: string;
  team_name: string;
  answer: SearchOption | null;
  stat_value: string;
}

export interface PuzzleFormInitial {
  id?: string;
  type: PuzzleType;
  title: string;
  category_label: string;
  max_strikes: 3 | 5;
  week_number: string;
  go_live_at: string;
  status: PuzzleStatus;
  lineupAnswer: SearchOption | null;
  lineupSlots: LineupSlotDraft[];
  gridSlots: GridSlotDraft[];
}

const emptyLineupSlots: LineupSlotDraft[] = POSITIONS.map((p) => ({
  position: p,
  past_teams: "",
  rating_2k: "",
  gif_url: "",
}));

const defaultInitial: PuzzleFormInitial = {
  type: "lineup_history",
  title: "",
  category_label: "",
  max_strikes: 5,
  week_number: "",
  go_live_at: "",
  status: "draft",
  lineupAnswer: null,
  lineupSlots: emptyLineupSlots,
  gridSlots: [],
};

export default function PuzzleForm({ initial }: { initial?: PuzzleFormInitial }) {
  const router = useRouter();
  const [form, setForm] = useState<PuzzleFormInitial>(initial ?? defaultInitial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLineup = LINEUP_TYPES.includes(form.type);

  function updateLineupSlot(index: number, field: keyof LineupSlotDraft, value: string) {
    setForm((f) => {
      const slots = [...f.lineupSlots];
      slots[index] = { ...slots[index], [field]: value };
      return { ...f, lineupSlots: slots };
    });
  }

  function addGridSlot() {
    setForm((f) => ({
      ...f,
      gridSlots: [...f.gridSlots, { team_logo: "", team_name: "", answer: null, stat_value: "" }],
    }));
  }

  function updateGridSlot(index: number, patch: Partial<GridSlotDraft>) {
    setForm((f) => {
      const slots = [...f.gridSlots];
      slots[index] = { ...slots[index], ...patch };
      return { ...f, gridSlots: slots };
    });
  }

  function removeGridSlot(index: number) {
    setForm((f) => ({ ...f, gridSlots: f.gridSlots.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(status: PuzzleStatus) {
    setSaving(true);
    setError(null);

    let slots;
    if (isLineup) {
      if (!form.lineupAnswer) {
        setError("Pick the answer team for this lineup puzzle.");
        setSaving(false);
        return;
      }
      slots = form.lineupSlots.map((s, i) => ({
        slot_index: i,
        answer_id: form.lineupAnswer!.id,
        clue_data:
          form.type === "lineup_history"
            ? { position: s.position, past_teams: s.past_teams.split(",").map((t) => t.trim()).filter(Boolean) }
            : form.type === "lineup_2k"
            ? { position: s.position, rating_2k: Number(s.rating_2k) }
            : { position: s.position, gif_url: s.gif_url },
      }));
    } else {
      if (form.gridSlots.some((s) => !s.answer || !s.team_logo)) {
        setError("Every grid slot needs a team logo URL and a selected player answer.");
        setSaving(false);
        return;
      }
      slots = form.gridSlots.map((s, i) => ({
        slot_index: i,
        answer_id: s.answer!.id,
        clue_data: { team_logo: s.team_logo, team_name: s.team_name, stat_value: s.stat_value || undefined },
      }));
    }

    const payload = {
      type: form.type,
      title: form.title,
      category_label: form.category_label || null,
      max_strikes: form.max_strikes,
      week_number: form.week_number ? Number(form.week_number) : null,
      go_live_at: form.go_live_at ? new Date(form.go_live_at).toISOString() : null,
      status,
      slots,
    };

    const url = initial?.id ? `/api/puzzles/${initial.id}` : "/api/puzzles";
    const method = initial?.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong saving this puzzle.");
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* ---------- basics ---------- */}
      <section className="space-y-4 rounded-lg border p-6" style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
        <Field label="Puzzle type">
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PuzzleType }))}
            className="w-full rounded-md border px-3 py-2"
            style={inputStyle}
          >
            {Object.entries(PUZZLE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Guess the Team: Career Path Lineup"
            className="w-full rounded-md border px-3 py-2"
            style={inputStyle}
          />
        </Field>

        {!isLineup && (
          <Field label="Category label (shown on the board)">
            <input
              value={form.category_label}
              onChange={(e) => setForm((f) => ({ ...f, category_label: e.target.value }))}
              placeholder="Highest PPG This Season"
              className="w-full rounded-md border px-3 py-2"
              style={inputStyle}
            />
          </Field>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Field label="Max strikes">
            <select
              value={form.max_strikes}
              onChange={(e) => setForm((f) => ({ ...f, max_strikes: Number(e.target.value) as 3 | 5 }))}
              className="w-full rounded-md border px-3 py-2"
              style={inputStyle}
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
            </select>
          </Field>
          <Field label="Week #">
            <input
              type="number"
              value={form.week_number}
              onChange={(e) => setForm((f) => ({ ...f, week_number: e.target.value }))}
              className="w-full rounded-md border px-3 py-2"
              style={inputStyle}
            />
          </Field>
          <Field label="Go live at">
            <input
              type="datetime-local"
              value={form.go_live_at}
              onChange={(e) => setForm((f) => ({ ...f, go_live_at: e.target.value }))}
              className="w-full rounded-md border px-3 py-2"
              style={inputStyle}
            />
          </Field>
        </div>
      </section>

      {/* ---------- lineup family ---------- */}
      {isLineup && (
        <section className="space-y-4 rounded-lg border p-6" style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
          <Field label="Answer team (the team this whole lineup belongs to)">
            <SearchableDropdown
              kind="team"
              clearOnSelect={false}
              placeholder={form.lineupAnswer?.label ?? "Search teams…"}
              onSelect={(opt) => setForm((f) => ({ ...f, lineupAnswer: opt }))}
            />
          </Field>

          {form.lineupSlots.map((slot, i) => (
            <div key={slot.position} className="rounded-md border p-4" style={{ borderColor: "var(--line)" }}>
              <p className="font-mono mb-2 text-sm" style={{ color: "var(--accent)" }}>
                {slot.position}
              </p>
              {form.type === "lineup_history" && (
                <input
                  value={slot.past_teams}
                  onChange={(e) => updateLineupSlot(i, "past_teams", e.target.value)}
                  placeholder="Timberwolves, Nuggets (comma-separated)"
                  className="w-full rounded-md border px-3 py-2"
                  style={inputStyle}
                />
              )}
              {form.type === "lineup_2k" && (
                <input
                  type="number"
                  value={slot.rating_2k}
                  onChange={(e) => updateLineupSlot(i, "rating_2k", e.target.value)}
                  placeholder="91"
                  className="w-full rounded-md border px-3 py-2"
                  style={inputStyle}
                />
              )}
              {form.type === "lineup_gif" && (
                <input
                  value={slot.gif_url}
                  onChange={(e) => updateLineupSlot(i, "gif_url", e.target.value)}
                  placeholder="https://…gif"
                  className="w-full rounded-md border px-3 py-2"
                  style={inputStyle}
                />
              )}
            </div>
          ))}
        </section>
      )}

      {/* ---------- grid family ---------- */}
      {!isLineup && (
        <section className="space-y-4 rounded-lg border p-6" style={{ background: "var(--panel)", borderColor: "var(--line)" }}>
          {form.gridSlots.map((slot, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 rounded-md border p-4" style={{ borderColor: "var(--line)" }}>
              <input
                value={slot.team_logo}
                onChange={(e) => updateGridSlot(i, { team_logo: e.target.value })}
                placeholder="Team logo URL"
                className="rounded-md border px-3 py-2"
                style={inputStyle}
              />
              <SearchableDropdown
                kind="player"
                clearOnSelect={false}
                placeholder={slot.answer?.label ?? "Answer player…"}
                onSelect={(opt) => updateGridSlot(i, { answer: opt })}
              />
              <input
                value={slot.stat_value}
                onChange={(e) => updateGridSlot(i, { stat_value: e.target.value })}
                placeholder="Stat value (optional)"
                className="rounded-md border px-3 py-2"
                style={inputStyle}
              />
              <button
                onClick={() => removeGridSlot(i)}
                className="rounded-md px-3 py-2 text-sm"
                style={{ color: "var(--strike)" }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addGridSlot}
            className="rounded-md border px-4 py-2 text-sm"
            style={{ borderColor: "var(--line)", color: "var(--court)" }}
          >
            + Add slot
          </button>
        </section>
      )}

      {error && <p style={{ color: "var(--strike)" }}>{error}</p>}

      <div className="flex gap-3">
        <button
          disabled={saving}
          onClick={() => handleSubmit("draft")}
          className="rounded-md border px-4 py-2"
          style={{ borderColor: "var(--line)", color: "var(--court)" }}
        >
          Save as draft
        </button>
        <button
          disabled={saving}
          onClick={() => handleSubmit("scheduled")}
          className="rounded-md px-4 py-2 font-medium"
          style={{ background: "var(--accent)", color: "var(--ink)" }}
        >
          Save &amp; schedule
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm" style={{ color: "var(--court-dim)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  background: "var(--panel-raised)",
  borderColor: "var(--line)",
  color: "var(--court)",
} as const;
