"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getActionUserId } from "@/lib/session";
import { deleteUserAndData } from "@/lib/account-deletion";
import bcrypt from "bcryptjs";
import { AuthError, CredentialsSignin } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIp, ONE_HOUR, rateLimit } from "@/lib/rate-limit";
import { normalizeUsername, validateUsername, isUsernameTaken } from "@/lib/username";
import { AUTH_MESSAGES } from "@/lib/auth-messages";
import { sendVerificationEmail } from "@/lib/account-emails";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type !== 'CredentialsSignin') return AUTH_MESSAGES.unknown;
      switch ((error as CredentialsSignin).code) {
        case 'rate_limited': return AUTH_MESSAGES.rateLimited;
        case 'unverified': return AUTH_MESSAGES.unverified;
        case 'suspended': return AUTH_MESSAGES.suspended;
        default: return AUTH_MESSAGES.invalid;
      }
    }
    throw error;
  }
}

export async function register(prevState: any, formData: FormData) {
  try {
    const name = ((formData.get('name') as string) || '').trim();
    const email = ((formData.get('email') as string) || '').trim().toLowerCase();
    const password = formData.get('password') as string;
    const username = normalizeUsername((formData.get('username') as string) || '');

    if (!name || !email || !password || !username) {
      return { success: false, error: "Missing required fields" };
    }

    // Stops one address from mass-creating accounts.
    if (!rateLimit(`register:${clientIp(await headers())}`, 5, ONE_HOUR)) {
      return { success: false, error: "Too many sign-ups from this network. Try again in an hour." };
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      return { success: false, error: usernameError };
    }

    if (await isUsernameTaken(username)) {
      return { success: false, error: "That username is already taken" };
    }

    if (password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existingUser) {
      return { success: false, error: "User already exists with this email" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      name,
      email,
      username,
      password: hashedPassword,
    });

    // Password accounts can sign in once they've confirmed the address is theirs.
    // The account exists either way; if sending fails they can ask for a new link.
    const emailSent = await sendVerificationEmail(email, name).catch((err) => {
      console.error("Could not send verification email:", err);
      return false;
    });
    return { success: true, email, emailSent };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to register" };
  }
}

export async function handleSignOut() {
  await signOut();
}

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/' });
}

export async function signInWithGitHub() {
  // Without keys Auth.js would throw; send people back with a readable message instead.
  if (!process.env.AUTH_GITHUB_ID || !process.env.AUTH_GITHUB_SECRET) redirect('/login?error=Configuration');
  await signIn('github', { redirectTo: '/' });
}

/** Live check for the "claim your username" box on the landing page. */
export async function checkUsernameAvailability(raw: string) {
  const username = normalizeUsername(raw);
  const error = validateUsername(username);
  if (error) return { username, available: false, error };
  if (await isUsernameTaken(username)) return { username, available: false, error: "That one's taken." };
  return { username, available: true, error: null };
}

/**
 * Permanently deletes the signed-in user's account: their uploaded files, avatar, every
 * book, concept, project and milestone, and the account itself. They confirm by typing
 * their username.
 */
export async function deleteAccount(confirmation: string) {
  const userId = await getActionUserId();
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { username: true } });
  if (!user) return { success: false, error: "Account not found." };
  if (confirmation.trim().toLowerCase() !== (user.username ?? "").toLowerCase()) {
    return { success: false, error: "Type your username exactly to confirm." };
  }

  await deleteUserAndData(userId);

  await signOut({ redirectTo: "/" });
  return { success: true };
}
