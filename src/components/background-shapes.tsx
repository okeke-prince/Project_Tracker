import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Loop = "float" | "drift" | "spin" | "sway" | "twinkle";

// One decorative piece. The outer box places it and pops it in on load; the inner box
// carries the look and a slow, endless loop. `t` is the loop length in seconds and `d`
// the entrance delay in milliseconds, so neighbouring shapes never move in step. Phones
// have no side margins, so only shapes marked `phone` (the corner pieces) show there.
function Shape({ at, look, loop = "float", t = 10, d = 0, phone = false, children }: {
  at: string;
  look?: string;
  loop?: Loop;
  t?: number;
  d?: number;
  phone?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn("bg-shape absolute", !phone && "hidden md:block", at)} style={{ "--in": `${d}ms` } as CSSProperties}>
      <div
        className={cn("h-full w-full", `bg-shape-${loop}`, look)}
        style={{ "--t": `${t}s`, "--delay": `${-(d % 7000) * 3}ms` } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

const pill = "rounded-full";
const ink = "bg-[var(--shape-ink)]";
const accent = "bg-[var(--shape-accent)]";
const soft = "bg-[var(--shape-soft)]";
const line = "border-[var(--shape-line)]";

// Light mode: pills, soft grey circles, dot grids and halftone corners. Everything sits
// in the side margins or tucks under the top and bottom edges, clear of the content.
function LightShapes() {
  return (
    <div className="dark:hidden">
      {/* Left margin */}
      <Shape at="-top-6 left-[8%] h-14 w-44" look={cn(pill, soft)} loop="drift" t={14} />
      <Shape at="top-[10%] left-[0.5%] h-12 w-12" phone look={cn(pill, soft)} t={9} d={120} />
      <Shape at="top-[15%] left-[2.5%] h-60 w-14" look={cn(pill, ink)} t={11} d={80} />
      <Shape at="top-[46%] -left-[7%] h-44 w-44" look={cn(pill, soft)} loop="sway" t={16} d={200} />
      <Shape at="top-[40%] left-[5%] h-44 w-14" look={cn(pill, accent)} t={9} d={160} />
      <Shape at="top-[72%] left-[1%] h-28 w-20" look="bg-dots text-[var(--shape-ink)]" loop="twinkle" t={6} d={220} />
      <Shape at="-bottom-6 left-[5%] h-28 w-14" look={cn(pill, accent)} t={12} d={300} />
      <Shape at="-bottom-14 -left-14 h-40 w-40 md:-bottom-16 md:-left-16 md:h-72 md:w-72" phone look="bg-halftone text-[var(--shape-ink)]" loop="twinkle" t={7} d={340} />

      {/* Under the navigation bar */}
      <Shape at="-top-4 left-[38%] h-12 w-40" look={cn(pill, line, "border-2")} loop="drift" t={13} d={140} />
      <Shape at="-top-6 left-[52%] h-12 w-40" look={cn(pill, accent)} loop="drift" t={15} d={60} />
      <Shape at="-top-5 right-[16%] h-12 w-24" look={cn(pill, ink)} loop="drift" t={14} d={100} />

      {/* Right margin */}
      <Shape at="-top-5 -right-6 h-32 w-12 md:-right-5 md:h-56 md:w-16" phone look={cn(pill, line, "border-2")} t={13} d={40} />
      <Shape at="top-[12%] right-[5%] h-9 w-9" look={cn(pill, line, "border-[6px] p-[3px]")} t={8} d={320}>
        <div className={cn("h-full w-full", pill, accent)} />
      </Shape>
      <Shape at="top-[22%] right-[2.5%] h-44 w-14" look={cn(pill, soft)} t={12} d={200} />
      <Shape at="top-[44%] right-[5%] h-40 w-14" look={cn(pill, accent)} t={9} d={260} />
      <Shape at="top-[58%] right-[0.5%] h-14 w-14" look={cn(pill, soft)} t={10} d={300} />
      <Shape at="top-[64%] right-[2%] h-24 w-14" look={cn(pill, ink)} t={11} d={340} />
      <Shape at="top-[52%] -right-3 h-9 w-9" look={cn(pill, line, "border-[6px] p-[3px]")} t={9} d={420}>
        <div className={cn("h-full w-full", pill, accent)} />
      </Shape>
      <Shape at="-bottom-6 right-[30%] h-12 w-40" look={cn(pill, soft)} loop="drift" t={16} d={380} />
      <Shape at="-bottom-14 -right-14 h-40 w-40 md:-bottom-20 md:-right-20 md:h-64 md:w-64" phone look="bg-halftone text-[var(--shape-ink)]" loop="twinkle" t={8} d={400} />
    </div>
  );
}

const wave = (
  <>
    <path d="M0 0h400c-20 40-70 30-90 70s30 80-20 110-90-10-140 30-60 70-150 90V0z" fill="var(--shape-accent-2)" />
    <path d="M0 0h330c-20 40-60 40-80 80s20 70-30 95-80-10-120 30-50 60-100 75V0z" fill="var(--shape-accent)" />
  </>
);

// Dark mode: flowing corner waves, outlined geometry and white dot columns.
function DarkShapes() {
  return (
    <div className="hidden dark:block">
      {/* Corner waves */}
      <Shape at="-top-10 -left-20 h-[150px] w-[225px] md:-top-14 md:-left-24 md:h-[240px] md:w-[360px]" phone loop="sway" t={18}>
        <svg viewBox="0 0 440 300" className="h-full w-full" fill="none">{wave}</svg>
      </Shape>
      <Shape at="-bottom-10 -right-20 h-[150px] w-[225px] md:-bottom-14 md:-right-24 md:h-[240px] md:w-[360px]" phone loop="sway" t={20} d={200}>
        <svg viewBox="0 0 440 300" className="h-full w-full rotate-180" fill="none">{wave}</svg>
      </Shape>

      {/* Under the navigation bar */}
      <Shape at="-top-24 right-[10%] h-40 w-40" look={cn(pill, "border-[10px] border-[var(--shape-accent)]")} t={14} d={120} />
      <Shape at="-top-6 left-[40%] h-20 w-48" loop="drift" t={16} d={180}>
        <svg viewBox="0 0 260 110" className="h-full w-full" fill="none" stroke="var(--shape-line)" strokeWidth="3" strokeLinecap="round" strokeDasharray="0 9">
          <path d="M10 105 95 5M55 105 140 5M100 105 185 5M145 105 230 5" />
        </svg>
      </Shape>

      {/* Left margin */}
      <Shape at="top-[24%] left-[2.5%] h-14 w-14" loop="spin" t={40} d={220}>
        <svg viewBox="0 0 56 56" className="h-full w-full">
          <path d="M44 8 10 26l34 22z" fill="var(--shape-accent)" />
          <path d="M48 14 16 30l32 20z" fill="none" stroke="var(--shape-line)" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </Shape>
      <Shape at="top-[36%] left-[6%] h-7 w-7" look={cn(pill, accent)} t={9} d={280} />
      <Shape at="top-[44%] left-[1%] h-56 w-20" look="bg-dots text-[var(--shape-line)]" loop="twinkle" t={7} d={300} />
      <Shape at="top-[78%] left-[4%] h-12 w-12" look="rotate-[12deg] border-[5px] border-[var(--shape-accent)]" loop="spin" t={45} d={380} />
      <Shape at="-bottom-6 left-[1.5%] h-28 w-24" t={12} d={460}>
        <svg viewBox="0 0 96 112" className="h-full w-full" fill="none" stroke="var(--shape-accent)" strokeWidth="6" strokeLinejoin="round">
          <path d="M48 6 86 66H10zM48 46 86 106H10z" />
        </svg>
      </Shape>

      {/* Right margin */}
      <Shape at="top-[12%] right-[1.5%] h-36 w-20" look="bg-dots text-[var(--shape-line)]" loop="twinkle" t={6} d={260} />
      <Shape at="top-[34%] right-[2%] h-20 w-20" loop="spin" t={50} d={160}>
        <svg viewBox="0 0 80 80" className="h-full w-full">
          <path d="m44 10 26 14v28L44 66 18 52V24z" fill="var(--shape-accent)" />
          <path d="m38 8 26 14v28L38 64 12 50V22z" fill="none" stroke="var(--shape-line)" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </Shape>
      <Shape at="top-[52%] right-[4.5%] h-11 w-11" look={cn(accent, "rotate-[24deg]")} t={11} d={340} />
      <Shape at="top-[64%] right-[1.5%] h-12 w-12" t={10} d={420}>
        <div className="absolute inset-0 translate-x-1 translate-y-1.5 rounded-full bg-[var(--shape-accent)]" />
        <div className="absolute inset-0 rounded-full border-[3px] border-[var(--shape-line)]" />
      </Shape>
      <Shape at="-bottom-28 left-[40%] h-40 w-72" loop="drift" t={18} d={500}>
        <svg viewBox="0 0 288 160" className="h-full w-full">
          <path d="M60 60 160 30l110 60-40 70H40z" fill="var(--shape-accent)" opacity="0.85" />
          <path d="M44 40 150 6l118 62" fill="none" stroke="var(--shape-line)" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </Shape>
    </div>
  );
}

// Decorative shapes fixed behind every page. They sit in the margins and fade out toward
// the middle (see .bg-shapes), so they frame the content without competing with it.
export function BackgroundShapes() {
  return (
    <div aria-hidden className="bg-shapes pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <LightShapes />
      <DarkShapes />
    </div>
  );
}
