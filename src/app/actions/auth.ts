"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
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
          return 'Invalid credentials.';
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

    const usernameError = validateUsername(username);
    if (usernameError) {
      return { success: false, error: usernameError };
    }

    if (await isUsernameTaken(username)) {
      return { success: false, error: "That username is already taken" };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
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

/** Live check for the "claim your username" box on the landing page. */
export async function checkUsernameAvailability(raw: string) {
  const username = normalizeUsername(raw);
  const error = validateUsername(username);
  if (error) return { username, available: false, error };
  if (await isUsernameTaken(username)) return { username, available: false, error: "That one's taken." };
  return { username, available: true, error: null };
}
