"use client";

import { Suspense, useActionState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { register, authenticate } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Compass, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

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

  useEffect(() => {
    // Registration signs the user in and redirects on the server; this is the fallback.
    if (state?.success) {
      window.location.href = '/login';
    }
  }, [state]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <Compass className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription>
            Create your profile and start building your timeline
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              Your profile will be public. See the{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">privacy policy</Link>{" "}
              for what others can see.
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
