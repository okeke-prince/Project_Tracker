import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserByUsername } from "@/db/queries";
import { ReportForm } from "./report-form";

export const metadata: Metadata = { title: "Report a profile · Knowledge Tracker", robots: { index: false } };

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const username = ((await searchParams).user ?? "").replace(/^@/, "");
  const user = username ? await getUserByUsername(username) : null;
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Report @{user.username}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tell us what&apos;s wrong with{" "}
          <Link href={`/${user.username}`} className="text-foreground underline underline-offset-4">this profile</Link>.
          Reports go to the people who run the site, not to the person you&apos;re reporting.
        </p>
      </header>
      <ReportForm username={user.username!} />
    </div>
  );
}
