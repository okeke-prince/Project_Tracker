import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

import { normalizeUsername, RESERVED } from "./username-format";

export { normalizeUsername, validateUsername, USERNAME_PATTERN } from "./username-format";

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
