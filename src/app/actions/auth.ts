"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { users, books, concepts, projects, milestones, accounts, sessions, bookConcepts, conceptProjects, bookProjects } from "@/db/schema";
import { eq, inArray, or } from "drizzle-orm";
import { getActionUserId } from "@/lib/session";
import { deleteAvatar, deleteBookFile } from "@/lib/storage";
import bcrypt from "bcryptjs";
import { AuthError, CredentialsSignin } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIp, ONE_HOUR, rateLimit } from "@/lib/rate-limit";
import { normalizeUsername, validateUsername, isUsernameTaken } from "@/lib/username";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return (error as CredentialsSignin).code === 'rate_limited'
            ? 'Too many sign-in attempts. Wait 15 minutes and try again.'
            : 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function register(prevState: any, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
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
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to register" };
  }

  // Sign the new user straight in. signIn redirects by throwing, so it sits outside the try.
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/manage',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: true };
    }
    throw error;
  }
  return { success: true };
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

  // Files first, so nothing is left behind in storage once the rows are gone.
  const userBooks = await db.select({ id: books.id, fileUrl: books.fileUrl }).from(books).where(eq(books.userId, userId));
  for (const book of userBooks) {
    if (book.fileUrl) await deleteBookFile(book.fileUrl).catch((err) => console.warn("Could not delete book file:", err));
  }
  await deleteAvatar(userId).catch((err) => console.warn("Could not delete avatar:", err));

  const bookIds = userBooks.map((b) => b.id);
  const conceptIds = (await db.select({ id: concepts.id }).from(concepts).where(eq(concepts.userId, userId))).map((c) => c.id);
  const projectIds = (await db.select({ id: projects.id }).from(projects).where(eq(projects.userId, userId))).map((p) => p.id);
  const none = ["__none__"]; // inArray needs at least one value

  // SQLite foreign keys aren't switched on for this connection, so remove the links explicitly.
  db.transaction((tx) => {
    tx.delete(bookConcepts).where(or(inArray(bookConcepts.bookId, bookIds.length ? bookIds : none), inArray(bookConcepts.conceptId, conceptIds.length ? conceptIds : none))).run();
    tx.delete(conceptProjects).where(or(inArray(conceptProjects.conceptId, conceptIds.length ? conceptIds : none), inArray(conceptProjects.projectId, projectIds.length ? projectIds : none))).run();
    tx.delete(bookProjects).where(or(inArray(bookProjects.bookId, bookIds.length ? bookIds : none), inArray(bookProjects.projectId, projectIds.length ? projectIds : none))).run();
    tx.delete(milestones).where(eq(milestones.userId, userId)).run();
    tx.delete(books).where(eq(books.userId, userId)).run();
    tx.delete(concepts).where(eq(concepts.userId, userId)).run();
    tx.delete(projects).where(eq(projects.userId, userId)).run();
    tx.delete(accounts).where(eq(accounts.userId, userId)).run();
    tx.delete(sessions).where(eq(sessions.userId, userId)).run();
    tx.delete(users).where(eq(users.id, userId)).run();
  });

  await signOut({ redirectTo: "/" });
  return { success: true };
}
