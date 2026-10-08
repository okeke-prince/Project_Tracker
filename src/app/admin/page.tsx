import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { alias } from "drizzle-orm/sqlite-core";
import { desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { requireUserId } from "@/lib/session";
import { REPORT_REASONS } from "@/lib/report-reasons";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ReportActions, UserActions } from "./admin-actions";

export const metadata: Metadata = { title: "Admin · Knowledge Tracker", robots: { index: false } };

const reporter = alias(users, "reporter");

export default async function AdminPage() {
  // Non-admins get the same 404 as a page that doesn't exist.
  if (!(await isAdmin(await requireUserId()))) notFound();

  const [openReports, suspended] = await Promise.all([
    db
      .select({
        id: reports.id,
        reason: reports.reason,
        details: reports.details,
        createdAt: reports.createdAt,
        userId: users.id,
        username: users.username,
        name: users.name,
        suspendedAt: users.suspendedAt,
        reporter: reporter.username,
      })
      .from(reports)
      .innerJoin(users, eq(users.id, reports.reportedUserId))
      .leftJoin(reporter, eq(reporter.id, reports.reporterId))
      .where(eq(reports.status, "open"))
      .orderBy(desc(reports.createdAt)),
    db
      .select({ id: users.id, username: users.username, name: users.name, suspendedAt: users.suspendedAt })
      .from(users)
      .where(isNotNull(users.suspendedAt))
      .orderBy(desc(users.suspendedAt)),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Reports people have sent, and accounts you&apos;ve suspended.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Open reports ({openReports.length})</h2>
        {openReports.length === 0 ? (
          <EmptyState title="No open reports" description="New reports about profiles show up here." />
        ) : (
          <ul className="space-y-3">
            {openReports.map((r) => (
              <li key={r.id} className="space-y-3 rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Link href={`/${r.username}`} className="font-medium underline-offset-4 hover:underline">{r.name || r.username}</Link>
                  <span className="text-muted-foreground">@{r.username}</span>
                  <Badge variant="outline">{REPORT_REASONS[r.reason]}</Badge>
                  {r.suspendedAt && <Badge variant="destructive">Suspended</Badge>}
                </div>
                {r.details && <p className="whitespace-pre-line text-sm text-muted-foreground">{r.details}</p>}
                <p className="text-xs text-muted-foreground">
                  {r.reporter ? <>From @{r.reporter}</> : "From a signed-out visitor"} on{" "}
                  {r.createdAt.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                </p>
                <ReportActions reportId={r.id} userId={r.userId} username={r.username ?? ""} suspended={!!r.suspendedAt} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Suspended accounts ({suspended.length})</h2>
        {suspended.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody is suspended.</p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {suspended.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <span>
                  <span className="font-medium">{u.name || u.username}</span> <span className="text-muted-foreground">@{u.username}</span>
                </span>
                <UserActions userId={u.id} username={u.username ?? ""} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
