import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

// Line-art illustrations for empty pages. Strokes use the text colour and faces use the
// card and muted colours, so they follow light and dark mode without separate artwork.

type Art = "cabinet" | "books" | "projects" | "concepts" | "milestones" | "search";

const FACE = "fill-card";
const SHADE = "fill-muted";
const HOLE = "fill-foreground/10";

function Svg({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 170"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

function Shadow({ cx = 100, cy = 152, rx = 64 }: { cx?: number; cy?: number; rx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={7} className="fill-foreground/[0.06]" stroke="none" />;
}

function Handle({ x, y }: { x: number; y: number }) {
  return <path d={`M${x} ${y} q0 4 4 4 h8 q4 0 4 -4`} />;
}

const ART: Record<Art, ReactNode> = {
  // A filing cabinet with its bottom drawer pulled open and empty.
  cabinet: (
    <>
      <Shadow cx={106} />
      <polygon points="130,30 152,19 152,128 130,139" className={SHADE} />
      <polygon points="70,30 92,19 152,19 130,30" className={FACE} />
      <rect x={70} y={30} width={60} height={109} className={FACE} />
      <rect x={74} y={139} width={8} height={5} className={SHADE} />
      <rect x={118} y={139} width={8} height={5} className={SHADE} />
      <rect x={76} y={37} width={48} height={44} rx={2} className={FACE} />
      <rect x={92} y={45} width={16} height={9} rx={1} />
      <Handle x={92} y={64} />
      <rect x={76} y={88} width={48} height={44} rx={2} className={HOLE} />
      <polygon points="102,102 124,88 124,132 102,146" className={FACE} />
      <polygon points="54,102 76,88 124,88 102,102" className={SHADE} />
      <path d="M60 101 L78 90 H118" opacity={0.5} />
      <rect x={54} y={102} width={48} height={44} rx={2} className={FACE} />
      <rect x={70} y={110} width={16} height={9} rx={1} />
      <Handle x={70} y={129} />
      <path d="M106 141 L122 131" opacity={0.5} />
    </>
  ),

  // A short stack of books with an open one resting on top.
  books: (
    <>
      <Shadow />
      <rect x={46} y={124} width={108} height={20} rx={2} className={FACE} />
      <path d="M56 124 v20 M140 129 h8 M140 134 h8 M140 139 h8" />
      <rect x={56} y={106} width={92} height={18} rx={2} className={SHADE} />
      <path d="M68 106 v18 M74 106 v18" />
      <rect x={50} y={90} width={98} height={16} rx={2} className={FACE} />
      <rect x={84} y={95} width={30} height={6} rx={1} />
      <path d="M68 78 q16 -9 32 0 q16 -9 32 0 v-40 q-16 -9 -32 0 q-16 -9 -32 0 z" className={FACE} />
      <path d="M100 78 v-40" />
      <path d="M76 48 q10 -4 18 0 M76 56 q10 -4 18 0 M76 64 q6 -2 12 0 M106 48 q10 -4 18 0 M106 56 q10 -4 18 0" opacity={0.5} />
      <path d="M150 34 v8 M146 38 h8 M44 54 v6 M41 57 h6" opacity={0.6} />
    </>
  ),

  // An open folder with a couple of blank sheets sticking out.
  projects: (
    <>
      <Shadow />
      <path d="M42 56 a4 4 0 0 1 4 -4 h30 l8 10 h68 a4 4 0 0 1 4 4 v76 H42 z" className={SHADE} />
      <rect x={56} y={42} width={80} height={62} rx={2} className={FACE} transform="rotate(-5 96 73)" />
      <rect x={66} y={38} width={80} height={62} rx={2} className={FACE} transform="rotate(4 106 69)" />
      <path d="M78 52 h40 M78 60 h52 M78 68 h30" opacity={0.5} transform="rotate(4 106 69)" />
      <path d="M36 82 a4 4 0 0 1 4 -4 h120 a4 4 0 0 1 4 4 l-6 60 H42 z" className={FACE} />
      <rect x={86} y={102} width={28} height={8} rx={2} />
    </>
  ),

  // A few connected nodes, with a dashed one waiting to be added.
  concepts: (
    <>
      <Shadow />
      <path d="M62 66 L110 42 L150 84 M62 66 L96 110 L150 84" />
      <path d="M96 110 L148 128" strokeDasharray="3 4" />
      <circle cx={62} cy={66} r={13} className={FACE} />
      <circle cx={110} cy={42} r={10} className={SHADE} />
      <circle cx={150} cy={84} r={12} className={FACE} />
      <circle cx={96} cy={110} r={15} className={SHADE} />
      <circle cx={148} cy={128} r={10} className={FACE} strokeDasharray="3 3" />
      <path d="M148 124 v8 M144 128 h8" />
      <path d="M46 116 v6 M43 119 h6 M160 36 v8 M156 40 h8" opacity={0.6} />
    </>
  ),

  // A flag planted on a small hill.
  milestones: (
    <>
      <Shadow />
      <path d="M36 146 q64 -46 128 0 z" className={SHADE} />
      <path d="M100 124 V44" />
      <path d="M100 46 h44 l-9 13 l9 13 h-44 z" className={FACE} />
      <ellipse cx={100} cy={124} rx={8} ry={3} className={FACE} />
      <path d="M58 52 v6 M55 55 h6 M150 98 v8 M146 102 h8" opacity={0.6} />
    </>
  ),

  // A magnifying glass between two crumpled sheets.
  search: (
    <>
      <Shadow />
      <polygon points="36,60 42,42 56,46 62,32 76,42 72,56 78,68 62,74 50,70 40,76" className={FACE} />
      <path d="M44 48 L58 60 L56 46 M62 36 L66 58 L74 52 M48 70 L60 62" opacity={0.5} />
      <polygon points="146,134 150,120 160,122 166,112 176,124 170,138 156,140" className={FACE} />
      <path d="M152 124 L162 132 L166 116" opacity={0.5} />
      <circle cx={148} cy={44} r={2} />
      <circle cx={158} cy={38} r={3} />
      <circle cx={168} cy={45} r={2} />
      <circle cx={160} cy={51} r={1.5} />
      <path d="M93 101 L56 132 a6 6 0 0 0 8 9 L102 109 z" className={SHADE} />
      <circle cx={118} cy={80} r={34} className={SHADE} />
      <circle cx={118} cy={80} r={26} className={FACE} />
      <path d="M100 70 a20 20 0 0 1 16 -12" strokeWidth={2.5} opacity={0.4} />
    </>
  ),
};

export function EmptyState({
  art = "cabinet",
  title,
  description,
  action,
  compact = false,
  className,
}: {
  art?: Art;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "gap-3 py-8" : "gap-4 py-12 sm:py-16", className)}>
      <div className={cn("animate-empty-float text-foreground/60", compact ? "w-32" : "w-44 sm:w-52")}>
        <Svg className="h-auto w-full">{ART[art]}</Svg>
      </div>
      <div className="space-y-1.5">
        <h3 className={cn("font-semibold tracking-tight", compact ? "text-base" : "text-xl")}>{title}</h3>
        {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground text-balance">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
