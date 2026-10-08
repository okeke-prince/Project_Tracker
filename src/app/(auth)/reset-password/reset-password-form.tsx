"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "@/app/actions/account";
import { AuthNotice } from "@/components/auth-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [state, formAction] = useActionState(resetPassword, null);
  const expired = state?.error?.includes("expired");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" autoComplete="new-password" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Type it again</Label>
        <Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      {state?.error && (
        <AuthNotice tone="error">
          {state.error}{" "}
          {expired && <Link href="/forgot-password" className="underline underline-offset-4">Send a new link</Link>}
        </AuthNotice>
      )}
      <SubmitButton className="w-full">Save new password</SubmitButton>
    </form>
  );
}
