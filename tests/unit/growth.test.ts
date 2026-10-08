import { describe, expect, it } from "vitest";
import { compareWithLastYear, growthByYear } from "@/lib/growth";

describe("growthByYear", () => {
  it("counts each kind per year, oldest first, keeping empty years", () => {
    const rows = growthByYear({
      books: ["2023-03-01", "2025-06-10"],
      concepts: ["2025-01-02 10:00:00"],
      projects: ["2025-09-30"],
      milestones: ["2023-07-15"],
    });
    expect(rows.map((r) => r.year)).toEqual(["2023", "2024", "2025"]);
    expect(rows[0]).toMatchObject({ books: 1, milestones: 1, total: 2 });
    expect(rows[1].total).toBe(0);
    expect(rows[2]).toMatchObject({ books: 1, concepts: 1, projects: 1, total: 3 });
  });

  it("returns nothing when there is nothing yet", () => {
    expect(growthByYear({ books: [], concepts: [], projects: [], milestones: [] })).toEqual([]);
  });
});

describe("compareWithLastYear", () => {
  const rows = growthByYear({ books: ["2025-01-01", "2026-01-01", "2026-02-01"], concepts: [], projects: [], milestones: [] });

  it("reports the trend against the year before", () => {
    expect(compareWithLastYear(rows, 2026)).toEqual({ thisYear: 2, lastYear: 1, trend: "up" });
    expect(compareWithLastYear(rows, 2027)).toEqual({ thisYear: 0, lastYear: 2, trend: "down" });
  });
});
