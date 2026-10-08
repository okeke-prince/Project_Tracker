"use client";

import { Suspense, useActionState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { register } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { useFormStatus } from "react-dom";
import { OAuthButtons } from "@/components/oauth-buttons";
import { AuthCard, AuthNotice } from "@/components/auth-card";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create account"}
    </Button>
  );
}

export default function RegisterPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  // Prefilled when someone claims a username on the landing page.
  const claimedUsername = useSearchParams().get("username") ?? "";
  const [state, formAction] = useActionState(register, null);
  const formRef = useRef<HTMLFormElement>(null);

  if (state?.success) return <CheckYourEmail email={state.email!} emailSent={state.emailSent!} />;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <LogoMark className="h-11 w-11" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription>
            Create your profile and start building your timeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OAuthButtons divider="or sign up with your email" />
          <form ref={formRef} action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="johndoe"
                defaultValue={claimedUsername}
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9-]+"
                autoComplete="username"
              />
              <p className="text-xs text-muted-foreground">Your public profile will live at /your-username.</p>
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" />
            </div>
            {state?.error && (
              <div className="text-sm text-destructive text-center">
                {state.error}
              </div>
            )}
            <SubmitButton />
            <p className="text-center text-xs text-muted-foreground">
              By creating an account you agree to the{" "}
              <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">terms</Link>. Your profile
              will be public; the{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">privacy policy</Link>{" "}
              explains what others can see.
            </p>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-6">
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function CheckYourEmail({ email, emailSent }: { email: string; emailSent: boolean }) {
  return (
    <AuthCard
      title="Check your email"
      description={<>We sent a link to <span className="font-medium text-foreground">{email}</span>. Open it to confirm your address, then sign in.</>}
      footer={<Link href="/login" className="font-semibold text-primary hover:underline">Go to sign in</Link>}
    >
      {!emailSent && (
        <AuthNotice tone="error">
          The email couldn&apos;t be sent. If you&apos;re running the app locally without an email service, the link is
          printed in the terminal running the server.
        </AuthNotice>
      )}
      <p className="text-center text-sm text-muted-foreground">
        Didn&apos;t get it?{" "}
        <Link href={`/resend-verification?email=${encodeURIComponent(email)}`} className="underline underline-offset-4 hover:text-foreground">
          Send a new link
        </Link>
      </p>
    </AuthCard>
  );
}
