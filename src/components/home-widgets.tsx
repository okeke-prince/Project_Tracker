import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Illustrations use the background-shape colours (--shape-*) so they match the page, plus
// one skin tone. Small parts move with the same CSS loops as the background shapes.
const SKIN = "oklch(0.74 0.07 55)";
const INK = "var(--shape-ink)";
const ACCENT = "var(--shape-accent)";
const ACCENT_2 = "var(--shape-accent-2)";
const LINE = "var(--shape-line)";

/** A person pointing up at a small mind map of linked dots. */
function MindMapPerson() {
  const centre = { x: 150, y: 46 };
  const nodes = [
    { x: 118, y: 22, r: 6, fill: INK },
    { x: 178, y: 20, r: 7, fill: ACCENT_2 },
    { x: 186, y: 62, r: 6, fill: INK },
    { x: 156, y: 86, r: 5, fill: ACCENT_2 },
    { x: 124, y: 70, r: 5, fill: ACCENT },
  ];
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" aria-hidden>
      <ellipse cx="72" cy="152" rx="40" ry="5" fill="var(--shape-soft)" />
      {/* Legs and shoes */}
      <rect x="60" y="112" width="10" height="38" rx="3" fill={INK} />
      <rect x="76" y="112" width="10" height="38" rx="3" fill={INK} />
      <rect x="54" y="146" width="17" height="6" rx="3" fill={INK} />
      <rect x="76" y="146" width="17" height="6" rx="3" fill={INK} />
      {/* Arms: one pointing up at the map, one at the side */}
      <path d="M90 82 112 58" stroke={SKIN} strokeWidth="8" strokeLinecap="round" />
      <path d="M56 82 50 110" stroke={SKIN} strokeWidth="8" strokeLinecap="round" />
      {/* Body, head and hair */}
      <rect x="53" y="68" width="40" height="50" rx="12" fill={ACCENT} />
      <rect x="67" y="58" width="12" height="12" fill={SKIN} />
      <circle cx="73" cy="50" r="13" fill={SKIN} />
      <path d="M60 49a13 13 0 0 1 26 0c-6-5-13-7-26 0z" fill={INK} />
      {/* The map */}
      <g className="bg-shape-float" style={{ "--t": "7s", "--delay": "0s" } as CSSProperties}>
        <path d={`M114 56 ${centre.x - 12} ${centre.y + 4}`} stroke={LINE} strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round" />
        {nodes.map((n) => (
          <line key={`l${n.x}`} x1={centre.x} y1={centre.y} x2={n.x} y2={n.y} stroke={LINE} strokeWidth="2" opacity="0.6" />
        ))}
        {nodes.map((n, i) => (
          <circle
            key={`n${n.x}`}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={n.fill}
            className="bg-shape-twinkle"
            style={{ "--t": "4s", "--delay": `${-i * 0.8}s` } as CSSProperties}
          />
        ))}
        <circle cx={centre.x} cy={centre.y} r="11" fill={ACCENT} />
        <circle cx={centre.x} cy={centre.y} r="4" fill="var(--card)" />
      </g>
    </svg>
  );
}

/** A person beside rising bars, with an arrow climbing over them. */
function GrowthPerson() {
  const bars = [
    { x: 108, h: 34, fill: ACCENT_2 },
    { x: 136, h: 60, fill: ACCENT },
    { x: 164, h: 92, fill: INK },
  ];
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" aria-hidden>
      <ellipse cx="60" cy="152" rx="36" ry="5" fill="var(--shape-soft)" />
      <line x1="96" y1="150" x2="192" y2="150" stroke={LINE} strokeWidth="2" opacity="0.5" />
      {bars.map((b, i) => (
        <rect
          key={b.x}
          x={b.x}
          y={150 - b.h}
          width="20"
          height={b.h}
          fill={b.fill}
          className="widget-bar"
          style={{ animationDelay: `${0.15 + i * 0.15}s` }}
        />
      ))}
      <g className="bg-shape-float" style={{ "--t": "6s", "--delay": "-1s" } as CSSProperties}>
        <path d="M100 104 128 80l20 8 34-38" fill="none" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M170 48h13v13" fill="none" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* Legs and shoes */}
      <rect x="48" y="112" width="10" height="38" rx="3" fill={INK} />
      <rect x="64" y="112" width="10" height="38" rx="3" fill={INK} />
      <rect x="42" y="146" width="17" height="6" rx="3" fill={INK} />
      <rect x="64" y="146" width="17" height="6" rx="3" fill={INK} />
      {/* Arms: one pointing at the bars, one on the hip */}
      <path d="M78 82 102 92" stroke={SKIN} strokeWidth="8" strokeLinecap="round" />
      <path d="M44 80 38 98 46 108" fill="none" stroke={SKIN} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Body, head and hair */}
      <rect x="41" y="68" width="40" height="50" rx="12" fill={INK} />
      <rect x="55" y="58" width="12" height="12" fill={SKIN} />
      <circle cx="61" cy="50" r="13" fill={SKIN} />
      <path d="M48 50c0-9 6-14 13-14s13 5 13 13c-4-3-9-4-13-1-4-3-9-3-13 2z" fill={ACCENT} />
    </svg>
  );
}

function Widget({ title, body, href, cta, art }: { title: string; body: string; href: string; cta: string; art: ReactNode }) {
  return (
    <div className="surface flex min-w-0 items-center gap-4 border bg-card p-5 sm:gap-6 sm:p-6">
      <div className="min-w-0 flex-1 space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{body}</p>
        <Link href={href} className={cn(buttonVariants({ size: "sm" }), "mt-2 rounded-none")}>
          {cta}
        </Link>
      </div>
      <div className="h-28 w-36 shrink-0 sm:h-36 sm:w-44 xl:h-40 xl:w-52">{art}</div>
    </div>
  );
}

/** The two illustrated shortcuts on the signed-in home page. */
export function HomeWidgets({ username }: { username: string | null }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Widget
        title="Have a mind map of what you've covered"
        body="See how your books, concepts and projects connect, all in one map."
        href={username ? `/${username}/map` : "/manage?tab=profile"}
        cta={username ? "Open your mind map" : "Pick a username first"}
        art={<MindMapPerson />}
      />
      <Widget
        title="Assess your general growth"
        body="See what you've added each year and how far your concepts have come."
        href="/growth"
        cta="See your growth"
        art={<GrowthPerson />}
      />
    </section>
  );
}
