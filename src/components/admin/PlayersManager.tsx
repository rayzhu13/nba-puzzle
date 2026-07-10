"use client";

import { useEffect, useState } from "react";
import type { Team } from "@/types/puzzle";

interface PlayerRow {
  id: string;
  name: string;
  headshot_url: string | null;
  team_id: string;
  teams: { name: string; abbreviation: string } | { name: string; abbreviation: string }[] | null;
}

export default function PlayersManager({ teams }: { teams: Team[] }) {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [headshotUrl, setHeadshotUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPlayers() {
    setLoading(true);
    const res = await fetch("/api/players");
    const data = await res.json();
    setPlayers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const res = await fetch("/api/players");
      const data = await res.json();
      if (!cancelled) {
        setPlayers(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, team_id: teamId, headshot_url: headshotUrl || null }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add player.");
      return;
    }

    setName("");
    setHeadshotUrl("");
    await loadPlayers();
  }

  const inputStyle = {
    background: "var(--panel-raised)",
    borderColor: "var(--line)",
    color: "var(--court)",
  } as const;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <form
        onSubmit={handleAdd}
        className="space-y-4 rounded-lg border p-6"
        style={{ background: "var(--panel)", borderColor: "var(--line)" }}
      >
        <h2 className="font-display text-xl" style={{ color: "var(--court)" }}>
          Add a player
        </h2>

        <label className="block">
          <span className="mb-1 block text-sm" style={{ color: "var(--court-dim)" }}>
            Name
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Luka Doncic"
            className="w-full rounded-md border px-3 py-2"
            style={inputStyle}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm" style={{ color: "var(--court-dim)" }}>
            Team
          </span>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            style={inputStyle}
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm" style={{ color: "var(--court-dim)" }}>
            Headshot URL (optional)
          </span>
          <input
            value={headshotUrl}
            onChange={(e) => setHeadshotUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-md border px-3 py-2"
            style={inputStyle}
          />
        </label>

        {error && <p style={{ color: "var(--strike)" }}>{error}</p>}

        <button
          type="submit"
          disabled={saving || !teamId}
          className="rounded-md px-4 py-2 font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--ink)" }}
        >
          {saving ? "Adding…" : "Add player"}
        </button>
      </form>

      <div className="rounded-lg border" style={{ borderColor: "var(--line)" }}>
        <div className="border-b px-5 py-3" style={{ borderColor: "var(--line)" }}>
          <h2 className="font-display text-lg" style={{ color: "var(--court)" }}>
            All players ({players.length})
          </h2>
        </div>
        {loading && (
          <p className="px-5 py-6" style={{ color: "var(--court-dim)" }}>
            Loading…
          </p>
        )}
        {!loading && players.length === 0 && (
          <p className="px-5 py-6" style={{ color: "var(--court-dim)" }}>
            No players yet — add your first one above.
          </p>
        )}
        {!loading &&
          players.map((p) => {
            const team = Array.isArray(p.teams) ? p.teams[0] : p.teams;
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 border-b px-5 py-3 last:border-b-0"
                style={{ borderColor: "var(--line)" }}
              >
                {p.headshot_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.headshot_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                )}
                <span style={{ color: "var(--court)" }}>{p.name}</span>
                <span className="font-mono ml-auto text-xs" style={{ color: "var(--court-dim)" }}>
                  {team?.abbreviation ?? "—"}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
