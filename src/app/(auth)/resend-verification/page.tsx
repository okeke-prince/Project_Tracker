"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { resendVerification } from "@/app/actions/account";
import { AuthCard, AuthNotice } from "@/components/auth-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export default function ResendVerificationPage() {
  return (
    <AuthCard
      title="Confirm your email"
      description="We'll send a new link to confirm your email address."
      footer={<Link href="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>}
    >
      {/* useSearchParams needs a Suspense boundary in the App Router. */}
      <Suspense>
        <ResendForm />
      </Suspense>
    </AuthCard>
  );
}

function ResendForm() {
  const [state, formAction] = useActionState(resendVerification, null);
  const email = useSearchParams().get("email") ?? "";

  if (state?.success) return <AuthNotice tone="success">{state.message}</AuthNotice>;
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={email} placeholder="m@example.com" required autoComplete="email" />
      </div>
      {state?.error && <AuthNotice tone="error">{state.error}</AuthNotice>}
      <SubmitButton className="w-full">Send a new link</SubmitButton>
    </form>
  );
}
