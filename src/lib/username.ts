import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

// Paths under /u/ are free, but keep obviously confusing names out.
const RESERVED = new Set(["admin", "api", "login", "logout", "register", "manage", "settings", "u"]);

export function normalizeUsername(raw: string): string {
  return raw.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
}

export function validateUsername(username: string): string | null {
  if (!USERNAME_PATTERN.test(username)) {
    return "Usernames are 3-30 characters: lowercase letters, numbers and dashes.";
  }
  if (RESERVED.has(username)) return "That username is reserved.";
  return null;
}

export async function isUsernameTaken(username: string, exceptUserId?: string): Promise<boolean> {
  const existing = await db.query.users.findFirst({ where: eq(users.username, username) });
  return !!existing && existing.id !== exceptUserId;
}

/** Picks a free username based on a name or email, adding a number if needed. */
export async function generateUsername(seed: string): Promise<string> {
  let base = normalizeUsername(seed.split("@")[0]);
  if (base.length < 3) base = `user-${base}`.replace(/-+$/, "");
  if (RESERVED.has(base)) base = `${base}-1`;

  let candidate = base;
  for (let i = 2; await isUsernameTaken(candidate); i++) {
    candidate = `${base.slice(0, 26)}-${i}`;
  }
  return candidate;
}
