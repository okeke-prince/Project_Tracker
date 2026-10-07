"use client";

import { useActionState, useEffect } from "react";
import { authenticate } from "@/app/actions/auth";
import { OAuthButtons } from "@/components/oauth-buttons";
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
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in"}
    </Button>
  );
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <Compass className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription>
            Enter your email to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OAuthButtons divider="Or with email" />

          <form action={dispatch} className="space-y-4">
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
                <Link href="#" className="text-xs text-muted-foreground hover:text-primary">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            {errorMessage && (
              <div className="text-sm text-destructive text-center">
                {errorMessage}
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
