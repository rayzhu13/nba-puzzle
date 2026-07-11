// The "neon broadcast" half-court background chosen from the design
// options — dark court with glowing shot-clock-orange line art. Purely
// decorative (aria-hidden); position labels/clue content render on top
// of it as a separate absolutely-positioned layer in LineupBoard.
export default function CourtBackground() {
  return (
    <svg
      viewBox="0 0 600 600"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <filter id="court-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="600" height="600" fill="#0a0d13" />
      <g
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        filter="url(#court-glow)"
        opacity="0.95"
      >
        <rect x="8" y="8" width="584" height="584" rx="4" />
        <path d="M 40 8 A 260 260 0 0 1 560 8" />
        <rect x="205" y="370" width="190" height="222" />
        <circle cx="300" cy="370" r="60" strokeDasharray="6 6" />
        <path d="M 40 592 A 237 237 0 0 1 560 592" />
        <circle cx="300" cy="560" r="8" fill="var(--accent)" stroke="none" />
      </g>
    </svg>
  );
}