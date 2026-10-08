import { describe, expect, it } from "vitest";
import { plural, statusLabel } from "@/lib/status";
import { eventYear, formatMonthDay } from "@/lib/dates";

describe("statusLabel", () => {
  it("turns status ids into sentence-case labels", () => {
    expect(statusLabel("want-to-read")).toBe("Want to read");
    expect(statusLabel("in-progress")).toBe("In progress");
    expect(statusLabel("finished")).toBe("Finished");
  });
});

describe("plural", () => {
  it("only adds an s when the count isn't one", () => {
    expect(plural(1, "concept")).toBe("1 concept");
    expect(plural(0, "concept")).toBe("0 concepts");
    expect(plural(3, "book")).toBe("3 books");
  });
});

describe("timeline dates", () => {
  it("shows the month and day, and reads the year, in UTC", () => {
    expect(formatMonthDay("2024-01-05")).toBe("Jan 5");
    expect(eventYear("2023-12-31")).toBe("2023");
    expect(eventYear("2024-12-31T23:30:00Z")).toBe("2024");
  });
});
