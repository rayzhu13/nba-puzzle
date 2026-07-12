"use client";

// The signature element: a segmented shot-clock style meter. Starts fully
// lit (5 stars) and each wrong guess dims one segment — echoing a shot
// clock counting down rather than a generic "star rating" widget.
export default function StarMeter({
  stars,
  maxStrikes,
  strikesUsed,
}: {
  stars: number;
  maxStrikes: number;
  strikesUsed: number;
}) {
  const segments = Array.from({ length: 5 }, (_, i) => i < Math.ceil(stars));

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1.5">
        {segments.map((lit, i) => (
          <div
            key={i}
            className="h-8 w-2.5 rounded-sm transition-colors duration-300"
            style={{
              background: lit ? "var(--accent)" : "var(--line)",
              boxShadow: lit ? "0 0 8px var(--accent)" : "none",
            }}
            aria-hidden
          />
        ))}
      </div>
      <div className="font-mono text-sm" style={{ color: "var(--court-dim)" }}>
        <span style={{ color: "var(--court)" }}>{stars.toFixed(1)}</span> / 5.0
        <span className="ml-3">
          {Math.min(strikesUsed, maxStrikes)}/{maxStrikes} strikes
        </span>
      </div>
    </div>
  );
}
