import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { verificationTokens } from "@/db/schema";

// One-time tokens for links we email: password resets and email checks. Only a hash of each
// token is stored, so a leaked database can't be used to reset anyone's password.

export type TokenPurpose = "reset" | "verify";

export const RESET_TOKEN_TTL = 60 * 60 * 1000; // 1 hour
export const VERIFY_TOKEN_TTL = 24 * 60 * 60 * 1000; // 1 day

const hash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
const identifier = (purpose: TokenPurpose, email: string) => `${purpose}:${email.toLowerCase()}`;

/** Creates a token for this email, replacing any earlier one for the same purpose. */
export async function createToken(purpose: TokenPurpose, email: string, ttlMs: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const id = identifier(purpose, email);
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, id));
  await db.insert(verificationTokens).values({ identifier: id, token: hash(token), expires: new Date(Date.now() + ttlMs) });
  return token;
}

/** True if the token is valid for this email. A valid token is used up. */
export async function consumeToken(purpose: TokenPurpose, email: string, token: string): Promise<boolean> {
  if (!email || !token) return false;
  const id = identifier(purpose, email);
  const [row] = await db
    .delete(verificationTokens)
    .where(and(eq(verificationTokens.identifier, id), eq(verificationTokens.token, hash(token))))
    .returning();
  return !!row && row.expires.getTime() > Date.now();
}
