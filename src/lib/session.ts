import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/** The signed-in user's id, or null for visitors. Suspended accounts count as signed out. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, id), columns: { suspendedAt: true } });
  return user && !user.suspendedAt ? id : null;
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
