"use client";

// Shown once a puzzle is lost, before anything is revealed. "Keep trying"
// removes itself once clicked — the player already made that choice, no
// need to keep offering it — while "Reveal answer" persists afterward
// (now alone, centered) in case they want to bail out of practice mode
// and just see the answer.
export default function LossOptions({
  onReveal,
  onKeepTrying,
  practiceMode,
  label = "Reveal answer",
}: {
  onReveal: () => void;
  onKeepTrying: () => void;
  practiceMode: boolean;
  label?: string;
}) {
  return (
    <div className={`flex gap-3 ${practiceMode ? "justify-center" : ""}`}>
      <button
        onClick={onReveal}
        className={`rounded-md px-4 py-3 font-medium ${practiceMode ? "" : "flex-1"}`}
        style={{ background: "var(--accent)", color: "var(--ink)" }}
      >
        {label}
      </button>
      {!practiceMode && (
        <button
          onClick={onKeepTrying}
          className="flex-1 rounded-md border px-4 py-3 font-medium"
          style={{ borderColor: "var(--line)", color: "var(--court)" }}
        >
          Keep trying
        </button>
      )}
    </div>
  );
}
