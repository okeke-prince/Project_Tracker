"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitReport } from "@/app/actions/moderation";
import { REPORT_REASONS } from "@/lib/report-reasons";
import { AuthNotice } from "@/components/auth-card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

export function ReportForm({ username }: { username: string }) {
  const [state, formAction] = useActionState(submitReport, null);

  if (state?.success) {
    return (
      <div className="space-y-4">
        <AuthNotice tone="success">Thanks. We&apos;ll look into it.</AuthNotice>
        <Link href={`/${username}`} className="text-sm underline underline-offset-4">Back to the profile</Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="username" value={username} />
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">What&apos;s the problem?</legend>
        {Object.entries(REPORT_REASONS).map(([value, label]) => (
          <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50 has-[:checked]:border-foreground/40 has-[:checked]:bg-muted/50">
            <input type="radio" name="reason" value={value} required className="accent-foreground" />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="details">Details</Label>
        <Textarea id="details" name="details" rows={4} maxLength={2000} placeholder="Links or anything that helps us check. For copyright, say what the work is and that you own it." />
      </div>
      {state?.error && <AuthNotice tone="error">{state.error}</AuthNotice>}
      <SubmitButton>Send report</SubmitButton>
    </form>
  );
}
