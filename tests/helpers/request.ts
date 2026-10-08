// Stand-in for next/headers, so server actions see a request from a chosen IP address.
// Use it with: vi.mock("next/headers", () => import("../helpers/request"));

let ip = "203.0.113.1";

/** Every call gives a fresh address, so rate limits from one test don't leak into the next. */
export function useNewIp() {
  ip = `198.51.100.${Math.floor(Math.random() * 250) + 1}-${crypto.randomUUID()}`;
  return ip;
}

export async function headers() {
  return new Headers({ "x-forwarded-for": ip });
}
