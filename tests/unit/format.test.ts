import { describe, expect, it } from "vitest";
import { formatEventDate } from "@/lib/dates";
import { repoLabel } from "@/components/repo-link";

describe("formatEventDate", () => {
  it("shows a plain date as that calendar day, whatever the server's time zone", () => {
    expect(formatEventDate("2024-01-05")).toBe("Jan 5, 2024");
    expect(formatEventDate("2023-12-31")).toBe("Dec 31, 2023");
  });

  it("formats full timestamps in UTC", () => {
    expect(formatEventDate("2024-03-10T23:30:00Z")).toBe("Mar 10, 2024");
  });
});

describe("repoLabel", () => {
  it("shows owner/repo for GitHub links", () => {
    expect(repoLabel("https://github.com/ada/engine")).toBe("ada/engine");
    expect(repoLabel("https://github.com/ada/engine.git")).toBe("ada/engine");
    expect(repoLabel("https://github.com/ada/engine/")).toBe("ada/engine");
  });

  it("keeps the host for other sites", () => {
    expect(repoLabel("https://gitlab.com/ada/engine")).toBe("gitlab.com/ada/engine");
  });

  it("returns anything that isn't a URL unchanged", () => {
    expect(repoLabel("not a url")).toBe("not a url");
  });
});
