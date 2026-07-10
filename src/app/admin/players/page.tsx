import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import PlayersManager from "@/components/admin/PlayersManager";
import type { Team } from "@/types/puzzle";

export default async function AdminPlayersPage() {
  const { ok } = await requireAdmin();
  if (!ok) redirect("/admin/login");

  const supabase = createAdminSupabase();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, abbreviation, logo_url")
    .order("name", { ascending: true });

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto mb-8 flex max-w-3xl items-center justify-between">
        <h1 className="font-display text-3xl" style={{ color: "var(--court)" }}>
          Manage players
        </h1>
        <Link href="/admin" className="text-sm underline" style={{ color: "var(--court-dim)" }}>
          Back to puzzles
        </Link>
      </div>

      {!teams?.length ? (
        <p className="mx-auto max-w-3xl" style={{ color: "var(--court-dim)" }}>
          No teams yet — seed the teams table first (see supabase/seed_teams.sql)
          before adding players.
        </p>
      ) : (
        <PlayersManager teams={teams as Team[]} />
      )}
    </main>
  );
}
