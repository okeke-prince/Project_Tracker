import { describe, expect, it } from "vitest";
import { normalizeUsername, validateUsername } from "@/lib/username-format";

describe("normalizeUsername", () => {
  it("lowercases and trims", () => {
    expect(normalizeUsername("  Ada-Lovelace ")).toBe("ada-lovelace");
  });

  it("turns spaces and symbols into single dashes", () => {
    expect(normalizeUsername("Ada  Lovelace!!")).toBe("ada-lovelace");
    expect(normalizeUsername("a.b_c")).toBe("a-b-c");
  });

  it("drops leading and trailing dashes", () => {
    expect(normalizeUsername("--ada--")).toBe("ada");
  });

  it("caps the length at 30 characters", () => {
    expect(normalizeUsername("a".repeat(40))).toHaveLength(30);
  });
});

describe("validateUsername", () => {
  it("accepts normal usernames", () => {
    expect(validateUsername("ada")).toBeNull();
    expect(validateUsername("ada-lovelace-1815")).toBeNull();
  });

  it("rejects names that are too short or too long", () => {
    expect(validateUsername("ab")).toMatch(/3-30 characters/);
    expect(validateUsername("a".repeat(31))).toMatch(/3-30 characters/);
  });

  it("rejects uppercase, symbols and dashes at the ends", () => {
    expect(validateUsername("Ada")).not.toBeNull();
    expect(validateUsername("ada_l")).not.toBeNull();
    expect(validateUsername("-ada")).not.toBeNull();
    expect(validateUsername("ada-")).not.toBeNull();
  });

  it("rejects names that clash with app routes", () => {
    for (const name of ["login", "manage", "api", "privacy", "dashboard"]) {
      expect(validateUsername(name)).toBe("That username is reserved.");
    }
  });
});
