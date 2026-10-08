"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithGitHub, signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { GitHubMark } from "@/components/repo-link";

// What Auth.js puts in ?error= when a Google or GitHub sign-in fails.
const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "That email already has an account with a password. Sign in with your email and password instead.",
  AccessDenied: "Sign-in was cancelled, or this account has been suspended.",
  Configuration: "That sign-in option isn't set up yet. Use your email and password for now.",
};

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function ErrorNotice() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive">
      {ERRORS[error] ?? "Sign-in didn't work. Please try again."}
    </p>
  );
}

/** Google and GitHub buttons, followed by an "or" divider before the email form. */
export function OAuthButtons({ divider }: { divider: string }) {
  return (
    <div className="space-y-4">
      <Suspense>
        <ErrorNotice />
      </Suspense>
      <div className="grid gap-2 sm:grid-cols-2">
        <form action={signInWithGoogle}>
          <Button variant="outline" className="w-full gap-2" type="submit">
            <GoogleMark /> Google
          </Button>
        </form>
        <form action={signInWithGitHub}>
          <Button variant="outline" className="w-full gap-2" type="submit">
            <GitHubMark className="h-4 w-4" /> GitHub
          </Button>
        </form>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-card px-2 text-muted-foreground">{divider}</span>
        </div>
      </div>
    </div>
  );
}
