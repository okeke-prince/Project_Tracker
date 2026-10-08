import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export type CredentialsResult =
  | { ok: true; user: typeof users.$inferSelect }
  | { ok: false; reason: "invalid" | "unverified" | "suspended" };

/**
 * Checks an email and password. Only someone with the right password learns that the
 * account is unverified or suspended; everyone else just gets "invalid".
 */
export async function checkCredentials(email: string, password: string): Promise<CredentialsResult> {
  const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
  if (!user?.password || !(await bcrypt.compare(password, user.password))) return { ok: false, reason: "invalid" };
  if (user.suspendedAt) return { ok: false, reason: "suspended" };
  if (!user.emailVerified) return { ok: false, reason: "unverified" };
  return { ok: true, user };
}
