import { auth } from "@/auth";
import { redirect } from "next/navigation";

/** The signed-in user's id, or null for visitors. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** For pages: the signed-in user's id, redirecting visitors to the login page. */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  return userId;
}

/** For server actions: the signed-in user's id, or an error to return to the form. */
export async function getActionUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("You need to be signed in to do that.");
  return userId;
}
