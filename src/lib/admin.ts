import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

// Admins are the accounts whose email is listed in ADMIN_EMAILS (comma-separated).

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { email: true, suspendedAt: true } });
  return !!user && !user.suspendedAt && isAdminEmail(user.email);
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
}
