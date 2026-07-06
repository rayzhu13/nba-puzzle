import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import PuzzleForm from "@/components/admin/PuzzleForm";

export default async function NewPuzzlePage() {
  const { ok } = await requireAdmin();
  if (!ok) redirect("/admin/login");

  return (
    <main className="min-h-screen px-4 py-12">
      <h1 className="font-display mb-8 text-center text-3xl" style={{ color: "var(--court)" }}>
        New puzzle
      </h1>
      <PuzzleForm />
    </main>
  );
}
