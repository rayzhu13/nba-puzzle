import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Puzzle } from "@/types/puzzle";
import { PUZZLE_TYPE_LABELS } from "@/types/puzzle";

const STATUS_COLOR: Record<string, string> = {
  live: "var(--positive)",
  scheduled: "var(--accent)",
  draft: "var(--court-dim)",
  archived: "var(--line)",
};

export default async function AdminPage() {
  const { ok } = await requireAdmin();
  if (!ok) redirect("/admin/login");

  const supabase = await createServerSupabase();
  const { data: puzzles } = await supabase
    .from("puzzles")
    .select("*")
    .order("go_live_at", { ascending: false, nullsFirst: false });

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-3xl" style={{ color: "var(--court)" }}>
            Puzzle admin
          </h1>
          <div className="flex gap-3">
            <Link
              href="/admin/players"
              className="rounded-md border px-4 py-2 font-medium"
              style={{ borderColor: "var(--line)", color: "var(--court)" }}
            >
              Manage players
            </Link>
            <Link
              href="/admin/new"
              className="rounded-md px-4 py-2 font-medium"
              style={{ background: "var(--accent)", color: "var(--ink)" }}
            >
              + New puzzle
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--line)" }}>
          {(puzzles as Puzzle[] | null)?.map((p) => (
            <Link
              key={p.id}
              href={`/admin/${p.id}`}
              className="flex items-center justify-between border-b px-5 py-4 transition-colors last:border-b-0 hover:brightness-110"
              style={{ borderColor: "var(--line)", background: "var(--panel)" }}
            >
              <div>
                <p className="font-medium" style={{ color: "var(--court)" }}>
                  {p.title}
                </p>
                <p className="text-sm" style={{ color: "var(--court-dim)" }}>
                  {PUZZLE_TYPE_LABELS[p.type]}
                  {p.go_live_at ? ` · goes live ${new Date(p.go_live_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--ink)", background: STATUS_COLOR[p.status] }}
              >
                {p.status}
              </span>
            </Link>
          ))}
          {!puzzles?.length && (
            <p className="px-5 py-8 text-center" style={{ color: "var(--court-dim)" }}>
              No puzzles yet — create your first one.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
