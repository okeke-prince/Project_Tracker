"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authenticate } from "@/app/actions/auth";
import { OAuthButtons } from "@/components/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { useFormStatus } from "react-dom";
import { AuthNotice } from "@/components/auth-card";
import { AUTH_MESSAGES } from "@/lib/auth-messages";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in"}
    </Button>
  );
}

// Notes for people arriving from an email link or a password reset.
const NOTICES: Record<string, { tone: "success" | "error"; text: string }> = {
  verified: { tone: "success", text: "Email confirmed. You can sign in now." },
  expired: { tone: "error", text: "That confirmation link has expired or was already used." },
  reset: { tone: "success", text: "Password changed. Sign in with your new password." },
};

function LinkNotice() {
  const params = useSearchParams();
  const key = params.get("verified") ? "verified" : params.get("verify") === "expired" ? "expired" : params.get("reset") ? "reset" : null;
  if (!key) return null;
  const notice = NOTICES[key];
  return (
    <AuthNotice tone={notice.tone}>
      {notice.text}{" "}
      {key === "expired" && <Link href="/resend-verification" className="underline underline-offset-4">Send a new link</Link>}
    </AuthNotice>
  );
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);
  // Remembered so "send a new link" can be prefilled with the address they just tried.
  const [email, setEmail] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <LogoMark className="h-11 w-11" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription>
            Enter your email to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense>
            <LinkNotice />
          </Suspense>
          <OAuthButtons divider="or use your email" />

          <form action={dispatch} onSubmit={(e) => setEmail(new FormData(e.currentTarget).get("email") as string)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            {errorMessage && (
              <div className="text-sm text-destructive text-center">
                {errorMessage}{" "}
                {errorMessage === AUTH_MESSAGES.unverified && (
                  <Link href={`/resend-verification?email=${encodeURIComponent(email)}`} className="underline underline-offset-4">
                    Send a new link
                  </Link>
                )}
              </div>
            )}
            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-6">
          <div className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
