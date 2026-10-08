import { eventYear } from "@/lib/dates";

export const GROWTH_KINDS = ["books", "concepts", "projects", "milestones"] as const;
export type GrowthKind = (typeof GROWTH_KINDS)[number];

/** The dates things happened: books finished, concepts added, projects shipped, milestones reached. */
export type GrowthInput = Record<GrowthKind, string[]>;

export type GrowthYear = Record<GrowthKind, number> & { year: string; total: number };

/** Counts per year, oldest first, with empty years in between kept so gaps stay visible. */
export function growthByYear(input: GrowthInput): GrowthYear[] {
  const byYear = new Map<number, GrowthYear>();
  for (const kind of GROWTH_KINDS) {
    for (const date of input[kind]) {
      const year = Number(eventYear(date));
      if (!Number.isFinite(year)) continue;
      const row = byYear.get(year) ?? { year: String(year), books: 0, concepts: 0, projects: 0, milestones: 0, total: 0 };
      row[kind] += 1;
      row.total += 1;
      byYear.set(year, row);
    }
  }
  if (byYear.size === 0) return [];
  const years = [...byYear.keys()];
  const rows: GrowthYear[] = [];
  for (let y = Math.min(...years); y <= Math.max(...years); y++) {
    rows.push(byYear.get(y) ?? { year: String(y), books: 0, concepts: 0, projects: 0, milestones: 0, total: 0 });
  }
  return rows;
}

/** How this year compares with last year, for the summary sentence. */
export function compareWithLastYear(rows: GrowthYear[], currentYear: number) {
  const thisYear = rows.find((r) => r.year === String(currentYear))?.total ?? 0;
  const lastYear = rows.find((r) => r.year === String(currentYear - 1))?.total ?? 0;
  return { thisYear, lastYear, trend: thisYear > lastYear ? "up" : thisYear < lastYear ? "down" : "same" } as const;
}
