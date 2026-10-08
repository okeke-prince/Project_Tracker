import type { Metadata } from "next";
import Link from "next/link";
import { getGrowthInput, getMasterySnapshot } from "@/db/queries";
import { requireUserId } from "@/lib/session";
import { compareWithLastYear, GROWTH_KINDS, growthByYear, type GrowthKind } from "@/lib/growth";
import { plural } from "@/lib/status";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your growth | Knowledge Tracker" };

const KINDS: Record<GrowthKind, { label: string; noun: string; color: string }> = {
  books: { label: "Books finished", noun: "book", color: "bg-amber-500" },
  concepts: { label: "Concepts added", noun: "concept", color: "bg-sky-500" },
  projects: { label: "Projects shipped", noun: "project", color: "bg-emerald-500" },
  milestones: { label: "Milestones", noun: "milestone", color: "bg-[var(--shape-accent)]" },
};

const STAGES = [
  { key: "studied", label: "Studied", color: "bg-amber-500" },
  { key: "applied", label: "Applied", color: "bg-sky-500" },
  { key: "mastered", label: "Mastered", color: "bg-emerald-500" },
] as const;

export default async function GrowthPage() {
  const userId = await requireUserId();
  const rows = growthByYear(await getGrowthInput(userId));
  const stages = await getMasterySnapshot(userId);
  const currentYear = new Date().getUTCFullYear();
  const { thisYear, lastYear, trend } = compareWithLastYear(rows, currentYear);
  const busiest = Math.max(1, ...rows.map((r) => r.total));
  const totals = Object.fromEntries(GROWTH_KINDS.map((k) => [k, rows.reduce((sum, r) => sum + r[k], 0)])) as Record<GrowthKind, number>;
  const inUse = stages.total > 0 ? Math.round(((stages.applied + stages.mastered) / stages.total) * 100) : 0;

  const summary =
    trend === "up"
      ? `You've added ${plural(thisYear, "thing")} this year, up from ${lastYear} last year.`
      : trend === "down"
        ? `You've added ${plural(thisYear, "thing")} this year, against ${lastYear} last year. There's still time.`
        : thisYear === 0
          ? "Nothing added this year yet."
          : `You've added ${plural(thisYear, "thing")} this year, the same as last year.`;

  if (rows.length === 0 && stages.total === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="font-display text-5xl sm:text-6xl">Your growth</h1>
        <EmptyState
          art="cabinet"
          title="Nothing to measure yet"
          description="Finish a book, add a concept, ship a project or record a milestone, and your growth shows up here year by year."
          action={<Link href="/manage" className={buttonVariants({ variant: "outline", size: "sm" })}>Add something</Link>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <header className="space-y-3">
        <h1 className="font-display text-5xl sm:text-6xl">Your growth</h1>
        <p className="text-lg text-muted-foreground">{summary}</p>
      </header>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold">So far</h2>
        <dl className="grid grid-cols-2 gap-px border bg-border sm:grid-cols-4">
          {GROWTH_KINDS.map((k) => (
            <div key={k} className="bg-card p-4">
              <dt className="text-sm text-muted-foreground">{KINDS[k].label}</dt>
              <dd className="font-display mt-1 text-4xl">{totals[k]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {rows.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b pb-2">
            <h2 className="text-lg font-semibold">Year by year</h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {GROWTH_KINDS.map((k) => (
                <li key={k} className="flex items-center gap-1.5">
                  <span aria-hidden className={`h-2.5 w-2.5 ${KINDS[k].color}`} />
                  {KINDS[k].label}
                </li>
              ))}
            </ul>
          </div>
          <ol className="space-y-3">
            {[...rows].reverse().map((r) => (
              <li key={r.year} className="grid grid-cols-[3.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
                <span className="font-display text-2xl">{r.year}</span>
                <div
                  className="flex h-6 overflow-hidden bg-muted"
                  role="img"
                  aria-label={
                    r.total === 0
                      ? `${r.year}: nothing added`
                      : `${r.year}: ${GROWTH_KINDS.filter((k) => r[k] > 0).map((k) => plural(r[k], KINDS[k].noun)).join(", ")}`
                  }
                >
                  <div className="flex h-full" style={{ width: `${(r.total / busiest) * 100}%` }}>
                    {GROWTH_KINDS.map((k) =>
                      r[k] > 0 ? <div key={k} className={`h-full ${KINDS[k].color}`} style={{ width: `${(r[k] / r.total) * 100}%` }} /> : null,
                    )}
                  </div>
                </div>
                <span className="text-right text-sm tabular-nums text-muted-foreground">{r.total}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {stages.total > 0 && (
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold">How far your concepts have come</h2>
          <p className="text-muted-foreground">
            {inUse}% of your {plural(stages.total, "concept")} are applied or mastered. Studying something is the start;
            using it in a project is where it sticks.
          </p>
          <div className="flex h-6 overflow-hidden" role="img" aria-label={STAGES.map((s) => `${stages[s.key]} ${s.label.toLowerCase()}`).join(", ")}>
            {STAGES.map((s) =>
              stages[s.key] > 0 ? <div key={s.key} className={s.color} style={{ width: `${(stages[s.key] / stages.total) * 100}%` }} /> : null,
            )}
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {STAGES.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <span aria-hidden className={`h-2.5 w-2.5 ${s.color}`} />
                {s.label} <span className="tabular-nums text-muted-foreground">{stages[s.key]}</span>
              </li>
            ))}
          </ul>
          <Link href="/concepts?status=studied" className="inline-block text-sm text-primary hover:underline">
            See what you could put to use next
          </Link>
        </section>
      )}
    </div>
  );
}
