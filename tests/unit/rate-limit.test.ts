import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientIp, rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("allows attempts up to the limit, then blocks", () => {
    const key = `login:${crypto.randomUUID()}`;
    expect([1, 2, 3].map(() => rateLimit(key, 3, 60_000))).toEqual([true, true, true]);
    expect(rateLimit(key, 3, 60_000)).toBe(false);
  });

  it("starts counting again once the window has passed", () => {
    const key = `login:${crypto.randomUUID()}`;
    rateLimit(key, 1, 60_000);
    expect(rateLimit(key, 1, 60_000)).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(rateLimit(key, 1, 60_000)).toBe(true);
  });

  it("counts each key separately", () => {
    const a = `login:${crypto.randomUUID()}`;
    const b = `login:${crypto.randomUUID()}`;
    rateLimit(a, 1, 60_000);
    expect(rateLimit(a, 1, 60_000)).toBe(false);
    expect(rateLimit(b, 1, 60_000)).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for address", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then to 'unknown'", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
