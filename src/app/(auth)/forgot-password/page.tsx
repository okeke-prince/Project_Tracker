"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/account";
import { AuthCard, AuthNotice } from "@/components/auth-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(requestPasswordReset, null);

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we'll send you a link to choose a new one."
      footer={<Link href="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>}
    >
      {state?.success ? (
        <AuthNotice tone="success">{state.message}</AuthNotice>
      ) : (
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required autoComplete="email" />
          </div>
          {state?.error && <AuthNotice tone="error">{state.error}</AuthNotice>}
          <SubmitButton className="w-full">Send reset link</SubmitButton>
        </form>
      )}
    </AuthCard>
  );
}
