"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { adminEmails, isAdmin } from "@/lib/admin";
import { deleteUserAndData } from "@/lib/account-deletion";
import { sendEmail } from "@/lib/email";
import { clientIp, ONE_HOUR, rateLimit } from "@/lib/rate-limit";
import { getCurrentUserId } from "@/lib/session";
import { siteUrl } from "@/lib/site-url";
import { REPORT_REASONS, type ReportReason } from "@/lib/report-reasons";

export type ReportFormState = { success: boolean; error?: string } | null;

/** Anyone, signed in or not, can report a profile. Admins get an email about it. */
export async function submitReport(_prev: ReportFormState, formData: FormData): Promise<ReportFormState> {
  const username = String(formData.get("username") ?? "").toLowerCase();
  const reason = String(formData.get("reason") ?? "") as ReportReason;
  const details = String(formData.get("details") ?? "").trim().slice(0, 2000);

  if (!Object.hasOwn(REPORT_REASONS, reason)) return { success: false, error: "Pick a reason." };
  if (reason === "other" && !details) return { success: false, error: "Tell us what's wrong." };

  const reported = await db.query.users.findFirst({ where: eq(users.username, username), columns: { id: true, username: true } });
  if (!reported) return { success: false, error: "That profile doesn't exist." };

  const reporterId = await getCurrentUserId();
  if (reporterId === reported.id) return { success: false, error: "You can't report your own profile." };

  if (!rateLimit(`report:${clientIp(await headers())}`, 5, ONE_HOUR)) {
    return { success: false, error: "You've sent a lot of reports. Try again in an hour." };
  }

  await db.insert(reports).values({ reportedUserId: reported.id, reporterId, reason, details: details || null });

  const admins = adminEmails();
  if (admins.length) {
    await sendEmail({
      to: admins,
      subject: `New report: @${reported.username} (${reason})`,
      text: `@${reported.username} was reported for: ${REPORT_REASONS[reason]}.\n\n${details || "(no details)"}\n\nReview it at ${siteUrl()}/admin`,
    }).catch((err) => console.error("Could not email admins about a report:", err));
  }
  return { success: true };
}

// Everything below is for admins only (see ADMIN_EMAILS).

async function requireAdmin() {
  const userId = await getCurrentUserId();
  if (!(await isAdmin(userId))) throw new Error("Only admins can do that.");
  return userId!;
}

function refresh(username?: string | null) {
  revalidatePath("/admin");
  if (username) revalidatePath(`/${username}`);
}

export async function setReportStatus(reportId: string, status: "resolved" | "dismissed") {
  await requireAdmin();
  await db.update(reports).set({ status, resolvedAt: new Date() }).where(and(eq(reports.id, reportId), eq(reports.status, "open")));
  refresh();
  return { success: true };
}

/** Hides the profile everywhere and blocks sign-in, until restored. Their data is kept. */
export async function suspendUser(userId: string) {
  const adminId = await requireAdmin();
  if (userId === adminId) return { success: false, error: "You can't suspend yourself." };
  const [user] = await db.update(users).set({ suspendedAt: new Date() }).where(eq(users.id, userId)).returning({ username: users.username });
  if (!user) return { success: false, error: "User not found." };
  // Suspending acts on every open report about them.
  await db.update(reports).set({ status: "resolved", resolvedAt: new Date() }).where(and(eq(reports.reportedUserId, userId), eq(reports.status, "open")));
  refresh(user.username);
  return { success: true };
}

export async function restoreUser(userId: string) {
  await requireAdmin();
  const [user] = await db.update(users).set({ suspendedAt: null }).where(eq(users.id, userId)).returning({ username: users.username });
  if (!user) return { success: false, error: "User not found." };
  refresh(user.username);
  return { success: true };
}

/** Permanently deletes the account and everything in it. */
export async function deleteUserAsAdmin(userId: string) {
  const adminId = await requireAdmin();
  if (userId === adminId) return { success: false, error: "Delete your own account from the Profile tab in Manage." };
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { username: true } });
  if (!user) return { success: false, error: "User not found." };
  await deleteUserAndData(userId);
  refresh(user.username);
  return { success: true };
}
