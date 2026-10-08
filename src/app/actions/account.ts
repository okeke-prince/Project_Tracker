"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/account-emails";
import { clientIp, ONE_HOUR, rateLimit } from "@/lib/rate-limit";
import { consumeToken } from "@/lib/tokens";

export type AccountFormState = { success: boolean; message?: string; error?: string } | null;

// These forms never say whether an account exists, so they can't be used to find out
// who has signed up.

/** Emails a password reset link, if there's an account for this address. */
export async function requestPasswordReset(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { success: false, error: "Enter your email address." };

  const ip = clientIp(await headers());
  if (!rateLimit(`reset:${ip}`, 5, ONE_HOUR) || !rateLimit(`reset:${email}`, 3, ONE_HOUR)) {
    return { success: false, error: "Too many requests. Try again in an hour." };
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true, suspendedAt: true } });
  if (user && !user.suspendedAt) {
    await sendPasswordResetEmail(email).catch((err) => console.error("Could not send reset email:", err));
  }
  return { success: true, message: "If there's an account for that email, we've sent a link to reset the password. Check your inbox." };
}

/** Sets a new password from a reset link, then sends the person to sign in. */
export async function resetPassword(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { success: false, error: "Use at least 8 characters." };
  if (password !== confirm) return { success: false, error: "The passwords don't match." };

  if (!(await consumeToken("reset", email, token))) {
    return { success: false, error: "This link has expired or was already used. Ask for a new one." };
  }

  // Getting the email proves the address is theirs, so it also counts as confirming it.
  const user = await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true, emailVerified: true } });
  if (!user) return { success: false, error: "This link has expired or was already used. Ask for a new one." };
  await db
    .update(users)
    .set({ password: await bcrypt.hash(password, 10), emailVerified: user.emailVerified ?? new Date() })
    .where(eq(users.id, user.id));

  redirect("/login?reset=1");
}

/** Sends a new confirmation link to an account that hasn't confirmed its email yet. */
export async function resendVerification(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { success: false, error: "Enter your email address." };

  const ip = clientIp(await headers());
  if (!rateLimit(`verify:${ip}`, 5, ONE_HOUR) || !rateLimit(`verify:${email}`, 3, ONE_HOUR)) {
    return { success: false, error: "Too many requests. Try again in an hour." };
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email), columns: { name: true, emailVerified: true } });
  if (user && !user.emailVerified) {
    await sendVerificationEmail(email, user.name).catch((err) => console.error("Could not send verification email:", err));
  }
  return { success: true, message: "If that account still needs confirming, we've sent a new link. Check your inbox." };
}
