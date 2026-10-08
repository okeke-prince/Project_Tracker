import { cn } from "@/lib/utils";

// The Knowledge Tracker mark: a "K" drawn as a small knowledge graph. The upright is a
// timeline with milestones at each end, and the arms branch out to new ideas, one learned
// (filled) and one still in progress (hollow). Drawn on a 48x48 grid.
export const MARK_PATHS = {
  lines: "M17 11V37M17 24L31 12.5M17 24L31 35.5",
  dots: [
    { cx: 17, cy: 11, r: 4 },
    { cx: 17, cy: 37, r: 4 },
    { cx: 17, cy: 24, r: 2.6 },
    { cx: 32, cy: 11.5, r: 4.4 },
  ],
  open: { cx: 32, cy: 36.5, r: 3.4 },
} as const;

/** Static SVG markup of the mark on a solid tile, for generated images (icons, link previews). */
export function markSvg({ fg = "#f3ede2", bg = "#0f0d0b", radius = 12 } = {}) {
  const dots = MARK_PATHS.dots.map((d) => `<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="${fg}"/>`).join("");
  const o = MARK_PATHS.open;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="${radius}" fill="${bg}"/><path d="${MARK_PATHS.lines}" stroke="${fg}" stroke-width="3.2" stroke-linecap="round" fill="none"/>${dots}<circle cx="${o.cx}" cy="${o.cy}" r="${o.r}" fill="${bg}" stroke="${fg}" stroke-width="2.6"/></svg>`;
}

/** The mark on a rounded tile. It inverts with the theme: dark tile in light mode, light tile in dark mode. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("h-7 w-7 shrink-0", className)}>
      <rect width="48" height="48" rx="12" className="fill-foreground" />
      <path d={MARK_PATHS.lines} className="stroke-background" strokeWidth={3.2} strokeLinecap="round" fill="none" />
      {MARK_PATHS.dots.map((d) => (
        <circle key={`${d.cx}-${d.cy}`} {...d} className="fill-background" />
      ))}
      <circle {...MARK_PATHS.open} className="fill-foreground stroke-background" strokeWidth={2.6} />
    </svg>
  );
}
